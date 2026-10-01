import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "./prisma";
import {
  demoHospitals,
  extractProviderFilters,
  normalizeProviderCity,
  normalizeProviderSpecialty,
  ProviderFilters,
  ProviderOption,
  searchDemoDoctors,
  searchDemoHospitals
} from "./provider-data";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SearchInput = z.object({
  specialty: z.string().optional(),
  city: z.string().optional()
});

export async function searchDoctors(input: unknown) {
  const args = SearchInput.parse(input);
  const filters = {
    specialty: normalizeProviderSpecialty(args.specialty),
    city: normalizeProviderCity(args.city)
  };

  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        active: true,
        ...(filters.specialty ? { specialty: { contains: filters.specialty, mode: "insensitive" } } : {}),
        ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {})
      },
      include: { hospital: true },
      take: 10
    });

    if (doctors.length) {
      return doctors.map((doctor) => ({
        id: doctor.id,
        type: "doctor" as const,
        name: doctor.name,
        nameAr: doctor.nameAr,
        specialty: doctor.specialty,
        specialtyAr: doctor.specialtyAr,
        city: doctor.city,
        cityAr: demoHospitals.find((hospital) => hospital.city.toLowerCase() === doctor.city.toLowerCase())?.cityAr ?? doctor.city,
        hospitalName: doctor.hospital.name,
        hospitalNameAr: doctor.hospital.nameAr
      }));
    }
  } catch {
    return searchDemoDoctors(filters);
  }

  return searchDemoDoctors(filters);
}

export async function searchHospitals(input: unknown) {
  const args = SearchInput.parse(input);
  const filters = {
    specialty: normalizeProviderSpecialty(args.specialty),
    city: normalizeProviderCity(args.city)
  };

  try {
    const hospitals = await prisma.hospital.findMany({
      where: {
        active: true,
        ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
        ...(filters.specialty ? { specialties: { has: filters.specialty } } : {})
      },
      take: 10
    });

    if (hospitals.length) {
      return hospitals.map((hospital) => ({
        id: hospital.id,
        type: "hospital" as const,
        name: hospital.name,
        nameAr: hospital.nameAr,
        city: hospital.city,
        cityAr: demoHospitals.find((item) => item.city.toLowerCase() === hospital.city.toLowerCase())?.cityAr ?? hospital.city,
        hospitalName: hospital.name,
        hospitalNameAr: hospital.nameAr
      }));
    }
  } catch {
    return searchDemoHospitals(filters);
  }

  return searchDemoHospitals(filters);
}

async function searchCareOptions(filters: ProviderFilters) {
  const [doctors, hospitals] = await Promise.all([
    searchDoctors(filters),
    searchHospitals(filters)
  ]);
  return [...doctors, ...hospitals];
}

const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "search_doctors",
    description: "Search the HealTrip demo provider directory for matching doctors. Return only matching records; never invent provider details.",
    parameters: {
      type: "object",
      properties: {
        specialty: { type: "string", description: "Medical specialty, e.g. Cardiology" },
        city: { type: "string", description: "City, e.g. Riyadh" }
      },
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "search_hospitals",
    description: "Search the HealTrip demo provider directory for matching hospitals. Return only matching records; never invent provider details.",
    parameters: {
      type: "object",
      properties: {
        specialty: { type: "string", description: "Required specialty if known" },
        city: { type: "string", description: "City if known" }
      },
      additionalProperties: false
    },
    strict: true
  }
];

const systemPrompt = `
You are HealTrip AI Patient Decision Assistant, a prototype support tool.

Follow this order: clarify missing details, assess urgent symptoms, recommend the next care step, then search providers only when appropriate. Return both matching doctors and hospitals when available. For routine provider requests, tell the user to confirm services and availability directly with the facility before presenting matches.

Safety:
- You are not a doctor and must not diagnose.
- For possible medical emergencies, prioritize urgent/emergency evaluation over routine provider search.
- Do not claim certainty about a diagnosis.
- Ask concise clarifying questions when critical information is missing.
- Answer the user's actual question directly and keep replies concise and practical.
- Never invent a doctor, hospital, address, phone number, availability, specialty, or other database fact.
- Provider recommendations must come only from tool results.
- Provider records in this prototype are fictional demo options, not real facilities or verified clinicians. Never imply real-world availability or credentials.
- If a tool returns no result, explicitly say that no matching provider was found in the prototype database.
- Reply entirely in the same language as the user's latest message (Arabic or English), including after using a tool.
- Do not give a generic chest-pain response unless the user asks about chest pain.
- For chest pain, ask about severe/pressure-like pain, shortness of breath, fainting, sweating, nausea, radiation to arm/jaw/back, and sudden onset when appropriate.
- If red-flag symptoms are present, advise seeking emergency medical care now rather than waiting for a specialist appointment.
`;

export type AssistantStage = "clarification" | "safety" | "recommendation" | "provider_search" | "response";
export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
  stage?: AssistantStage;
};

type AssistantReply = {
  text: string;
  stage: AssistantStage;
  toolUsed: boolean;
  emergency: boolean;
  providers: ProviderOption[];
};

type WorkflowPlan = {
  context: string;
  isArabic: boolean;
  providerIntent: boolean;
  hospitalIntent: boolean;
  filters: ProviderFilters;
  reply?: AssistantReply;
};

function hasPositiveTerm(text: string, terms: string[]) {
  return terms.some((term) => {
    let index = text.indexOf(term);
    while (index >= 0) {
      const clause = text.slice(0, index).split(/[.!?;]/u).at(-1) ?? "";
      const negations = [...clause.matchAll(/\bno\b|\bnot\b|\bwithout\b|\bdenies\b|لا أعاني من|لا يوجد|ما عندي|بدون/giu)];
      const lastNegation = negations.at(-1);
      const negated = lastNegation && !/(?:\bbut\b|\bhowever\b|\balthough\b|لكن|بل)/iu.test(
        clause.slice((lastNegation.index ?? 0) + lastNegation[0].length)
      );
      if (!negated) return true;
      index = text.indexOf(term, index + term.length);
    }
    return false;
  });
}

function planWorkflow(message: string, history: ConversationTurn[]): WorkflowPlan {
  const userContext = history.filter((turn) => turn.role === "user").map((turn) => turn.content);
  const context = [...userContext, message].join(" ");
  const lower = context.toLowerCase();
  const isArabic = /[\u0600-\u06ff]/u.test(message);
  const hasAny = (terms: string[]) => terms.some((term) => lower.includes(term));
  const filters = extractProviderFilters(context);
  const hospitalIntent = hasAny(["hospital", "medical center", "clinic", "مستشفى", "مركز طبي", "عيادة"]);
  const doctorIntent = hasAny([
    "doctor", "physician", "specialist", "cardiologist", "pediatrician", "dermatologist", "orthopedic",
    "neurologist", "gynecologist", "family doctor", "طبيب", "دكتور", "استشاري"
  ]);
  const providerAction = hasAny(["find", "looking for", "need", "recommend", "search", "أبحث", "ابحث", "أحتاج", "احتاج", "رشح"]);
  const providerIntent =
    (providerAction && (doctorIntent || hospitalIntent)) ||
    ((doctorIntent || hospitalIntent) && Boolean(filters.city)) ||
    Boolean(filters.city && filters.specialty);
  const previousStage = [...history].reverse().find((turn) => turn.role === "assistant")?.stage;
  const symptomTerms = [
    "chest pain", "pain", "hurt", "fever", "cough", "dizzy", "dizziness", "nausea", "headache", "rash",
    "ألم", "وجع", "حمى", "حرارة", "سعال", "كحة", "دوخة", "غثيان", "صداع", "طفح", "أعراض"
  ];
  const healthConcern = hasAny(symptomTerms);
  const currentHealthConcern = symptomTerms.some((term) => message.toLowerCase().includes(term));
  const chestPain = hasAny(["chest pain", "ألم في الصدر", "ألم صدر", "وجع الصدر"]);
  const emergencyTerms = [
    "shortness of breath", "trouble breathing", "difficulty breathing", "can't breathe", "cannot breathe", "fainting", "fainted",
    "heavy sweating", "severe chest pain", "pain spreading to", "pain radiating to", "spreading to the arm",
    "ضيق التنفس", "صعوبة في التنفس", "لا أستطيع التنفس", "إغماء", "تعرق شديد", "ألم شديد في الصدر",
    "ألم يمتد إلى", "يمتد للذراع", "انتشار الألم"
  ];
  const emergency = hasPositiveTerm(lower, emergencyTerms) ||
    (chestPain && hasPositiveTerm(lower, ["severe", "sudden", "worsening", "شديد", "مفاجئ", "يتفاقم"]));
  const reply = (text: string, stage: AssistantStage, isEmergency = false): AssistantReply => ({
    text, stage, toolUsed: false, emergency: isEmergency, providers: []
  });

  if (emergency) {
    return {
      context, isArabic, providerIntent, hospitalIntent, filters,
      reply: reply(
        isArabic
          ? "قد تشير الأعراض التي ذكرتها إلى حالة طارئة. اطلب خدمات الطوارئ المحلية الآن، ولا تنتظر موعدًا عاديًا. لا يستطيع هذا النموذج تشخيص حالتك."
          : "The symptoms you mentioned may need urgent assessment. Contact your local emergency service now rather than waiting for a routine appointment. This prototype cannot diagnose your condition.",
        "safety",
        true
      )
    };
  }

  if (currentHealthConcern && previousStage !== "clarification") {
    const text = chestPain
      ? isArabic
        ? "قبل اقتراح الخطوة التالية، هل ألم الصدر موجود الآن؟ متى بدأ وما شدته؟ وهل لديك ضيق تنفس أو إغماء أو تعرق شديد أو ألم يمتد للذراع أو الفك أو الظهر؟ إذا كانت الأعراض شديدة أو مفاجئة، اطلب الطوارئ الآن."
        : "Before suggesting a next step, is the chest pain happening now? When did it start, and how severe is it? Any trouble breathing, fainting, heavy sweating, or pain spreading to your arm, jaw, or back? Seek emergency care now for severe or sudden symptoms."
      : isArabic
        ? "حتى أساعدك في اختيار الخطوة المناسبة: متى بدأت الأعراض، وما شدتها؟ هل تزداد سوءًا أو يصاحبها ضيق تنفس أو إغماء أو ألم شديد؟ اطلب الطوارئ فورًا إذا كانت الأعراض شديدة أو مفاجئة."
        : "To help choose an appropriate next step: when did the symptoms start, and how severe are they? Are they worsening or accompanied by trouble breathing, fainting, or severe pain? Seek emergency care now for severe or sudden symptoms.";
    return { context, isArabic, providerIntent, hospitalIntent, filters, reply: reply(text, "clarification") };
  }

  if (providerIntent && (!filters.city || (!hospitalIntent && !filters.specialty))) {
    const text = isArabic
      ? !filters.city
        ? "في أي مدينة تبحث؟ بعد تحديد الموقع سأعرض الخيارات التجريبية المناسبة."
        : "ما التخصص الذي تبحث عنه؟ إذا لم تكن متأكدًا، اذكر سبب الزيارة لأساعدك في اختيار التخصص المناسب."
      : !filters.city
        ? "Which Saudi city should I search? Once I have the location, I can show matching demo options."
        : "Which specialty are you looking for? If you are unsure, describe the reason for the visit and I can help identify a suitable specialty.";
    return { context, isArabic, providerIntent, hospitalIntent, filters, reply: reply(text, "clarification") };
  }

  if (healthConcern && previousStage === "clarification" && !providerIntent) {
    const text = chestPain
      ? isArabic
        ? "بناءً على ما ذكرت، اطلب تقييمًا طبيًا عاجلًا اليوم إذا كان ألم الصدر مستمرًا أو متكررًا. إذا أصبح شديدًا أو مفاجئًا، أو ظهر ضيق تنفس أو إغماء، اتصل بالطوارئ فورًا. لا أستطيع التشخيص."
        : "Based on what you shared, seek prompt medical assessment today if the chest pain is ongoing or recurring. If it becomes severe or sudden, or you develop trouble breathing or fainting, contact emergency services immediately. I can't diagnose."
      : isArabic
        ? "بناءً على ما ذكرت، تواصل مع مقدم رعاية صحية لتقييم الأعراض. اطلب رعاية عاجلة إذا اشتدت أو ساءت بسرعة. لا أستطيع التشخيص."
        : "Based on what you shared, contact a healthcare professional to assess the symptoms. Seek urgent care if they become severe or worsen quickly. I can't diagnose.";
    return { context, isArabic, providerIntent, hospitalIntent, filters, reply: reply(text, "recommendation") };
  }

  return { context, isArabic, providerIntent, hospitalIntent, filters };
}

async function mockResponse(message: string, plan: WorkflowPlan): Promise<AssistantReply> {
  const lower = message.toLowerCase();
  const isArabic = plan.isArabic;
  const hasAny = (terms: string[]) => terms.some((term) => lower.includes(term));

  if (plan.providerIntent) {
    const providers = await searchCareOptions(plan.filters);
    const safetyNote = plan.context.toLowerCase().includes("chest pain") || plan.context.includes("ألم في الصدر")
      ? isArabic
        ? "اطلب تقييمًا طبيًا إذا استمر الألم، والطوارئ فورًا إذا ظهرت علامات شديدة. "
        : "Seek medical assessment if the pain continues, and emergency care immediately if severe warning signs appear. "
      : isArabic
        ? "للرعاية غير الطارئة، تواصل مباشرةً مع المنشأة لتأكيد الخدمات والتوفر. "
        : "For routine care, contact the facility directly to confirm services and availability. ";
    const text = safetyNote + (providers.length
      ? isArabic
        ? "هذه خيارات الأطباء والمستشفيات التجريبية المطابقة لطلبك. البيانات خيالية وليست لمقدمي رعاية حقيقيين، ولا تتضمن توفر المواعيد."
        : "These matching demo doctors and hospitals may fit your request. Records are fictional, not real providers, and do not include appointment availability."
      : isArabic
        ? "لم أجد خيارًا مطابقًا في دليل البيانات التجريبية. جرّب مدينة أو تخصصًا آخر."
        : "I couldn't find a match in the demo directory. Try another city or specialty.");
    return { text, stage: "provider_search", toolUsed: true, emergency: false, providers };
  }

  const medicationQuestion = hasAny([
    "what medicine", "what medication", "what dose", "which medicine", "should i take", "diagnose me",
    "ما الدواء", "أي دواء", "ما الجرعة", "شخص حالتي", "ما تشخيصي"
  ]);
  const appointmentPrep = hasAny([
    "prepare for an appointment", "prepare for my appointment", "doctor appointment", "appointment with my doctor",
    "موعد طبي", "موعد الطبيب", "أستعد للموعد", "الاستعداد للموعد"
  ]);
  const text = medicationQuestion
    ? isArabic
      ? "لا أستطيع تشخيص حالتك أو تحديد دواء أو جرعة مناسبة لك. استشر طبيبًا أو صيدليًا، واذكر الأعراض ومتى بدأت وأي أدوية تتناولها لأساعدك في التفكير في الخطوة التالية."
      : "I can't diagnose you or choose a medication or dose for you. Please ask a clinician or pharmacist. If you share your symptoms, when they began, and any medicines you take, I can help you consider an appropriate next step."
    : appointmentPrep
      ? isArabic
        ? "للاستعداد للموعد، دوّن أعراضك ووقت بدايتها، وأحضر قائمة بأدويتك وحساسياتك وسجلك الطبي ذي الصلة. اكتب أسئلتك مسبقًا، واسأل الطبيب عن الخطوات التالية ومتى ينبغي طلب رعاية عاجلة."
        : "Before the appointment, note your symptoms and when they began, bring a list of medicines and allergies, and gather relevant records. Write down your questions, and ask about next steps and when to seek urgent care."
      : isArabic
        ? "أستطيع مساعدتك في التفكير في الخطوة الطبية التالية، لكن لا أستطيع التشخيص. ما الذي تحتاج المساعدة بشأنه: أعراض، أو اختيار نوع مقدم الرعاية، أو الاستعداد لموعد طبي؟"
        : "I can help you think through a medical next step, but I can't diagnose. What would you like help with: symptoms, choosing a type of provider, or preparing for an appointment?";
  return {
    text,
    stage: medicationQuestion || appointmentPrep ? "recommendation" : "response",
    toolUsed: false,
    emergency: false,
    providers: []
  };
}

export async function runAssistant(message: string, history: ConversationTurn[] = []) {
  const plan = planWorkflow(message, history);
  if (plan.reply) return plan.reply;
  if (!client) return mockResponse(message, plan);

  const transcript = [
    ...history.slice(-12).map((turn) => `${turn.role === "user" ? "Patient" : "Assistant"}: ${turn.content}`),
    `Patient: ${message}`
  ].join("\n");

  const first = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: systemPrompt,
    input: transcript,
    tools,
    tool_choice: plan.providerIntent ? "required" : "none"
  }).catch((error: unknown) => {
    console.error("OpenAI request failed; using the local workflow.", error);
    return null;
  });
  if (!first) return mockResponse(message, plan);

  const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];
  const providerOptions: ProviderOption[] = [];
  let usedTool = false;

  for (const item of first.output) {
    if (item.type !== "function_call") continue;
    usedTool = true;

    const args = JSON.parse(item.arguments || "{}");
    let result: unknown;

    if (item.name === "search_doctors") {
      const matches = await searchCareOptions(SearchInput.parse(args));
      result = { doctors: matches.filter((option) => option.type === "doctor"), hospitals: matches.filter((option) => option.type === "hospital") };
      providerOptions.push(...matches);
    } else if (item.name === "search_hospitals") {
      const matches = await searchCareOptions(SearchInput.parse(args));
      result = { doctors: matches.filter((option) => option.type === "doctor"), hospitals: matches.filter((option) => option.type === "hospital") };
      providerOptions.push(...matches);
    }
    else result = { error: "Unknown tool" };

    toolOutputs.push({
      type: "function_call_output",
      call_id: item.call_id,
      output: JSON.stringify(result)
    });
  }

  if (!usedTool) {
    return {
      text: first.output_text,
      stage: "response",
      toolUsed: false,
      emergency: false,
      providers: []
    };
  }

  const second = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: systemPrompt,
    previous_response_id: first.id,
    input: [...toolOutputs],
    tools
  }).catch((error: unknown) => {
    console.error("OpenAI follow-up failed; using local provider results.", error);
    return null;
  });
  if (!second) return mockResponse(message, plan);

  return {
    text: second.output_text,
    stage: "provider_search",
    toolUsed: true,
    emergency: false,
    providers: [...new Map(providerOptions.map((option) => [`${option.type}:${option.id}`, option])).values()]
  };
}
