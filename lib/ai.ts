import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "./prisma";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SearchInput = z.object({
  specialty: z.string().optional(),
  city: z.string().optional()
});

export async function searchDoctors(input: unknown) {
  const args = SearchInput.parse(input);
  return prisma.doctor.findMany({
    where: {
      active: true,
      ...(args.specialty ? { specialty: { contains: args.specialty, mode: "insensitive" } } : {}),
      ...(args.city ? { city: { contains: args.city, mode: "insensitive" } } : {})
    },
    include: { hospital: true },
    take: 10
  });
}

export async function searchHospitals(input: unknown) {
  const args = SearchInput.parse(input);
  return prisma.hospital.findMany({
    where: {
      active: true,
      ...(args.city ? { city: { contains: args.city, mode: "insensitive" } } : {}),
      ...(args.specialty
        ? { specialties: { has: args.specialty } }
        : {})
    },
    take: 10
  });
}

const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "search_doctors",
    description: "Search the verified HealTrip doctor database. Never invent doctor data.",
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
    description: "Search the verified HealTrip hospital database. Never invent hospital data.",
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

Safety:
- You are not a doctor and must not diagnose.
- For possible medical emergencies, prioritize urgent/emergency evaluation over routine provider search.
- Do not claim certainty about a diagnosis.
- Ask concise clarifying questions when critical information is missing.
- Answer the user's actual question directly and keep replies concise and practical.
- Never invent a doctor, hospital, address, phone number, availability, specialty, or other database fact.
- Provider recommendations must come only from tool results.
- If a tool returns no result, explicitly say that no matching provider was found in the prototype database.
- Reply entirely in the same language as the user's latest message (Arabic or English), including after using a tool.
- Do not give a generic chest-pain response unless the user asks about chest pain.
- For chest pain, ask about severe/pressure-like pain, shortness of breath, fainting, sweating, nausea, radiation to arm/jaw/back, and sudden onset when appropriate.
- If red-flag symptoms are present, advise seeking emergency medical care now rather than waiting for a specialist appointment.
`;

function mockResponse(message: string) {
  const lower = message.toLowerCase();
  const isArabic = /[\u0600-\u06ff]/u.test(message);
  const hasAny = (terms: string[]) => terms.some((term) => lower.includes(term));
  const chestPain = hasAny(["chest pain", "ألم في الصدر", "ألم صدر", "وجع الصدر"]);
  const emergency = hasAny([
    "shortness of breath",
    "difficulty breathing",
    "can't breathe",
    "cannot breathe",
    "fainting",
    "fainted",
    "heavy sweating",
    "severe chest pain",
    "ضيق التنفس",
    "صعوبة في التنفس",
    "لا أستطيع التنفس",
    "إغماء",
    "تعرق شديد",
    "ألم شديد في الصدر"
  ]);
  const providerSearch = hasAny([
    "find a doctor",
    "find me a doctor",
    "looking for a doctor",
    "need a doctor",
    "find a hospital",
    "looking for a hospital",
    "need a specialist",
    "book an appointment",
    "أبحث عن طبيب",
    "ابحث عن طبيب",
    "أحتاج طبيب",
    "أحتاج دكتور",
    "أبحث عن مستشفى",
    "أحتاج مستشفى",
    "أحتاج موعد"
  ]);
  const medicationQuestion = hasAny([
    "what medicine",
    "what medication",
    "what dose",
    "which medicine",
    "should i take",
    "diagnose me",
    "ما الدواء",
    "أي دواء",
    "ما الجرعة",
    "شخص حالتي",
    "ما تشخيصي"
  ]);
  const appointmentPrep = hasAny([
    "prepare for an appointment",
    "prepare for my appointment",
    "doctor appointment",
    "appointment with my doctor",
    "موعد طبي",
    "موعد الطبيب",
    "أستعد للموعد",
    "الاستعداد للموعد"
  ]);
  const healthConcern = hasAny([
    "pain",
    "hurt",
    "fever",
    "cough",
    "dizzy",
    "dizziness",
    "nausea",
    "headache",
    "rash",
    "symptom",
    "ألم",
    "وجع",
    "حمى",
    "حرارة",
    "سعال",
    "كحة",
    "دوخة",
    "غثيان",
    "صداع",
    "طفح",
    "أعراض"
  ]);
  let text: string;
  let isEmergency = false;

  if (emergency) {
    text = isArabic
      ? "قد تشير الأعراض التي ذكرتها إلى حالة طارئة. اطلب خدمات الطوارئ المحلية الآن، ولا تنتظر موعدًا عاديًا. لا يستطيع هذا النموذج تشخيص حالتك."
      : "The symptoms you mentioned may need urgent assessment. Contact your local emergency service now rather than waiting for a routine appointment. This prototype cannot diagnose your condition.";
    isEmergency = true;
  } else if (providerSearch) {
    text = isArabic
      ? "لا أستطيع التحقق من مقدمي الرعاية أو المواعيد في الوضع التجريبي، ولن أخمّن أسماءً أو تفاصيل. استخدم دليلًا رسميًا وتأكد من التخصص والتوفر مباشرةً مع العيادة."
      : "I can't verify providers or appointments in this demo mode, so I won't guess names or availability. Please use an official directory and confirm the specialty and appointment details with the clinic.";
  } else if (medicationQuestion) {
    text = isArabic
      ? "لا أستطيع تشخيص حالتك أو تحديد دواء أو جرعة مناسبة لك. استشر طبيبًا أو صيدليًا، واذكر الأعراض ومتى بدأت وأي أدوية تتناولها لأساعدك في التفكير في الخطوة التالية."
      : "I can't diagnose you or choose a medication or dose for you. Please ask a clinician or pharmacist. If you share your symptoms, when they began, and any medicines you take, I can help you consider an appropriate next step.";
  } else if (appointmentPrep) {
    text = isArabic
      ? "للاستعداد للموعد، دوّن أعراضك ووقت بدايتها، وأحضر قائمة بأدويتك وحساسياتك وسجلك الطبي ذي الصلة. اكتب أسئلتك مسبقًا، واسأل الطبيب عن الخطوات التالية ومتى ينبغي طلب رعاية عاجلة."
      : "Before the appointment, note your symptoms and when they began, bring a list of medicines and allergies, and gather relevant records. Write down your questions, and ask about next steps and when to seek urgent care.";
  } else if (chestPain) {
    text = isArabic
      ? "هل ألم الصدر يحدث الآن؟ متى بدأ وما شدته؟ وهل يصاحبه ضيق في التنفس أو إغماء أو تعرق أو غثيان أو امتداد الألم إلى الذراع أو الفك أو الظهر؟ إذا كان شديدًا أو مفاجئًا، أو صاحبه ضيق تنفس أو إغماء، اطلب الطوارئ الآن."
      : "Is the chest pain happening now? When did it start, and how severe is it? Do you also have shortness of breath, fainting, sweating, nausea, or pain spreading to your arm, jaw, or back? Seek emergency care now if it is severe or sudden, or comes with trouble breathing or fainting.";
  } else if (healthConcern) {
    text = isArabic
      ? "متى بدأت الأعراض، وما شدتها؟ هل تزداد سوءًا أو يصاحبها عرض آخر؟ لا أستطيع التشخيص، لكن هذه التفاصيل تساعدني على اقتراح خطوة رعاية مناسبة. اطلب الطوارئ فورًا إذا كانت الأعراض شديدة أو تتفاقم بسرعة."
      : "When did the symptoms start, and how severe are they? Are they getting worse or accompanied by anything else? I can't diagnose, but those details can help me suggest an appropriate care next step. Seek urgent care if symptoms are severe or worsening quickly.";
  } else {
    text = isArabic
      ? "أستطيع مساعدتك في التفكير في الخطوة الطبية التالية، لكن لا أستطيع التشخيص. ما الذي تحتاج المساعدة بشأنه: أعراض، أو اختيار نوع مقدم الرعاية، أو الاستعداد لموعد طبي؟"
      : "I can help you think through a medical next step, but I can't diagnose. What would you like help with: symptoms, choosing a type of provider, or preparing for an appointment?";
  }

  return {
    text,
    toolUsed: false,
    emergency: isEmergency,
    providers: []
  };
}

export async function runAssistant(message: string) {
  if (!client) return mockResponse(message);

  const first = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: systemPrompt,
    input: message,
    tools
  });

  const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];
  let usedTool = false;

  for (const item of first.output) {
    if (item.type !== "function_call") continue;
    usedTool = true;

    const args = JSON.parse(item.arguments || "{}");
    let result: unknown;

    if (item.name === "search_doctors") result = await searchDoctors(args);
    else if (item.name === "search_hospitals") result = await searchHospitals(args);
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
  });

  return {
    text: second.output_text,
    toolUsed: true,
    emergency: false,
    providers: []
  };
}
