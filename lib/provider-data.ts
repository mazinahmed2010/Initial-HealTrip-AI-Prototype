export type DemoDoctor = {
  id: string;
  name: string;
  nameAr: string;
  specialty: string;
  specialtyAr: string;
  languages: string[];
};

export type DemoHospital = {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  address: string;
  phone: string;
  emergency: boolean;
  specialties: string[];
  doctors: DemoDoctor[];
};

export type ProviderOption = {
  id: string;
  type: "doctor" | "hospital";
  name: string;
  nameAr: string;
  specialty?: string;
  specialtyAr?: string;
  city: string;
  cityAr: string;
  hospitalName: string;
  hospitalNameAr: string;
};

export type ProviderFilters = {
  city?: string;
  specialty?: string;
};

export const demoHospitals: DemoHospital[] = [
  {
    id: "demo-riyadh",
    name: "HealTrip Demo Hospital - Riyadh",
    nameAr: "مستشفى هيل تريب التجريبي - الرياض",
    city: "Riyadh",
    cityAr: "الرياض",
    address: "Demo record only - Riyadh",
    phone: "Not provided - demo data",
    emergency: false,
    specialties: ["Cardiology", "Internal Medicine", "Pediatrics", "Dermatology"],
    doctors: [
      { id: "demo-doc-riyadh-cardio", name: "Dr. Amal Saleh (Demo)", nameAr: "د. أمل صالح (تجريبي)", specialty: "Cardiology", specialtyAr: "أمراض القلب", languages: ["Arabic", "English"] },
      { id: "demo-doc-riyadh-internal", name: "Dr. Omar Hassan (Demo)", nameAr: "د. عمر حسن (تجريبي)", specialty: "Internal Medicine", specialtyAr: "الطب الباطني", languages: ["Arabic", "English"] },
      { id: "demo-doc-riyadh-pediatrics", name: "Dr. Huda Nasser (Demo)", nameAr: "د. هدى ناصر (تجريبي)", specialty: "Pediatrics", specialtyAr: "طب الأطفال", languages: ["Arabic"] },
      { id: "demo-doc-riyadh-dermatology", name: "Dr. Faisal Amin (Demo)", nameAr: "د. فيصل أمين (تجريبي)", specialty: "Dermatology", specialtyAr: "الأمراض الجلدية", languages: ["Arabic", "English"] }
    ]
  },
  {
    id: "demo-jeddah",
    name: "HealTrip Demo Hospital - Jeddah",
    nameAr: "مستشفى هيل تريب التجريبي - جدة",
    city: "Jeddah",
    cityAr: "جدة",
    address: "Demo record only - Jeddah",
    phone: "Not provided - demo data",
    emergency: false,
    specialties: ["Cardiology", "Neurology", "Obstetrics and Gynecology"],
    doctors: [
      { id: "demo-doc-jeddah-cardio", name: "Dr. Lina Ahmed (Demo)", nameAr: "د. لينا أحمد (تجريبي)", specialty: "Cardiology", specialtyAr: "أمراض القلب", languages: ["Arabic", "English"] },
      { id: "demo-doc-jeddah-neuro", name: "Dr. Sami Khalid (Demo)", nameAr: "د. سامي خالد (تجريبي)", specialty: "Neurology", specialtyAr: "طب الأعصاب", languages: ["Arabic", "English"] },
      { id: "demo-doc-jeddah-obgyn", name: "Dr. Reem Abdullah (Demo)", nameAr: "د. ريم عبدالله (تجريبي)", specialty: "Obstetrics and Gynecology", specialtyAr: "النساء والولادة", languages: ["Arabic"] }
    ]
  },
  {
    id: "demo-dammam",
    name: "HealTrip Demo Hospital - Dammam",
    nameAr: "مستشفى هيل تريب التجريبي - الدمام",
    city: "Dammam",
    cityAr: "الدمام",
    address: "Demo record only - Dammam",
    phone: "Not provided - demo data",
    emergency: false,
    specialties: ["Orthopedics", "Internal Medicine", "Pediatrics"],
    doctors: [
      { id: "demo-doc-dammam-ortho", name: "Dr. Youssef Mansour (Demo)", nameAr: "د. يوسف منصور (تجريبي)", specialty: "Orthopedics", specialtyAr: "جراحة العظام", languages: ["Arabic", "English"] },
      { id: "demo-doc-dammam-internal", name: "Dr. Maha Ibrahim (Demo)", nameAr: "د. مها إبراهيم (تجريبي)", specialty: "Internal Medicine", specialtyAr: "الطب الباطني", languages: ["Arabic", "English"] },
      { id: "demo-doc-dammam-pediatrics", name: "Dr. Khalid Faris (Demo)", nameAr: "د. خالد فارس (تجريبي)", specialty: "Pediatrics", specialtyAr: "طب الأطفال", languages: ["Arabic"] }
    ]
  },
  {
    id: "demo-makkah",
    name: "HealTrip Demo Hospital - Makkah",
    nameAr: "مستشفى هيل تريب التجريبي - مكة المكرمة",
    city: "Makkah",
    cityAr: "مكة المكرمة",
    address: "Demo record only - Makkah",
    phone: "Not provided - demo data",
    emergency: false,
    specialties: ["Family Medicine", "Internal Medicine", "Cardiology"],
    doctors: [
      { id: "demo-doc-makkah-family", name: "Dr. Noura Saeed (Demo)", nameAr: "د. نورة سعيد (تجريبي)", specialty: "Family Medicine", specialtyAr: "طب الأسرة", languages: ["Arabic", "English"] },
      { id: "demo-doc-makkah-cardio", name: "Dr. Tariq Adel (Demo)", nameAr: "د. طارق عادل (تجريبي)", specialty: "Cardiology", specialtyAr: "أمراض القلب", languages: ["Arabic"] }
    ]
  },
  {
    id: "demo-madinah",
    name: "HealTrip Demo Hospital - Madinah",
    nameAr: "مستشفى هيل تريب التجريبي - المدينة المنورة",
    city: "Madinah",
    cityAr: "المدينة المنورة",
    address: "Demo record only - Madinah",
    phone: "Not provided - demo data",
    emergency: false,
    specialties: ["Pediatrics", "Dermatology", "Neurology"],
    doctors: [
      { id: "demo-doc-madinah-pediatrics", name: "Dr. Salma Faisal (Demo)", nameAr: "د. سلمى فيصل (تجريبي)", specialty: "Pediatrics", specialtyAr: "طب الأطفال", languages: ["Arabic", "English"] },
      { id: "demo-doc-madinah-dermatology", name: "Dr. Bader Saif (Demo)", nameAr: "د. بدر سيف (تجريبي)", specialty: "Dermatology", specialtyAr: "الأمراض الجلدية", languages: ["Arabic"] },
      { id: "demo-doc-madinah-neuro", name: "Dr. Aisha Rami (Demo)", nameAr: "د. عائشة رامي (تجريبي)", specialty: "Neurology", specialtyAr: "طب الأعصاب", languages: ["Arabic", "English"] }
    ]
  },
  {
    id: "demo-buraydah",
    name: "HealTrip Demo Hospital - Buraydah",
    nameAr: "مستشفى هيل تريب التجريبي - بريدة",
    city: "Buraydah",
    cityAr: "بريدة",
    address: "Demo record only - Buraydah",
    phone: "Not provided - demo data",
    emergency: false,
    specialties: ["Orthopedics", "Cardiology", "Family Medicine"],
    doctors: [
      { id: "demo-doc-buraydah-ortho", name: "Dr. Faisal Nasser (Demo)", nameAr: "د. فيصل ناصر (تجريبي)", specialty: "Orthopedics", specialtyAr: "جراحة العظام", languages: ["Arabic"] },
      { id: "demo-doc-buraydah-family", name: "Dr. Rawan Adel (Demo)", nameAr: "د. روان عادل (تجريبي)", specialty: "Family Medicine", specialtyAr: "طب الأسرة", languages: ["Arabic", "English"] }
    ]
  }
];

const cities = [
  { name: "Riyadh", aliases: ["riyadh", "الرياض"] },
  { name: "Jeddah", aliases: ["jeddah", "jiddah", "جدة", "جده"] },
  { name: "Dammam", aliases: ["dammam", "الدمام"] },
  { name: "Makkah", aliases: ["makkah", "mecca", "مكة", "مكه", "مكة المكرمة"] },
  { name: "Madinah", aliases: ["madinah", "medina", "المدينة", "المدينة المنورة"] },
  { name: "Buraydah", aliases: ["buraydah", "buraidah", "بريدة"] }
];

const specialties = [
  { name: "Cardiology", aliases: ["cardiology", "cardiologist", "heart", "القلب", "قلب", "قلبي"] },
  { name: "Internal Medicine", aliases: ["internal medicine", "internist", "باطنية", "طبيب باطني", "الطب الباطني"] },
  { name: "Pediatrics", aliases: ["pediatrics", "pediatrician", "children's doctor", "أطفال", "الاطفال", "الأطفال"] },
  { name: "Dermatology", aliases: ["dermatology", "dermatologist", "skin", "جلدية", "الأمراض الجلدية"] },
  { name: "Orthopedics", aliases: ["orthopedics", "orthopedic", "orthopaedic", "عظام", "العظام"] },
  { name: "Neurology", aliases: ["neurology", "neurologist", "neurologic", "أعصاب", "طب الأعصاب"] },
  { name: "Obstetrics and Gynecology", aliases: ["obstetrics", "gynecology", "gynecologist", "ob/gyn", "نساء", "النساء والولادة"] },
  { name: "Family Medicine", aliases: ["family medicine", "family doctor", "طب الأسرة", "طبيب أسرة"] }
];

function normalize(value?: string) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

export function normalizeProviderCity(value?: string) {
  const query = normalize(value);
  return cities.find((city) => city.aliases.some((alias) => query.includes(normalize(alias))))?.name ?? value;
}

export function normalizeProviderSpecialty(value?: string) {
  const query = normalize(value);
  return specialties.find((specialty) => specialty.aliases.some((alias) => query.includes(normalize(alias))))?.name ?? value;
}

export function extractProviderFilters(message: string): ProviderFilters {
  const query = normalize(message);
  return {
    city: cities.find((city) => city.aliases.some((alias) => query.includes(normalize(alias))))?.name,
    specialty: specialties.find((specialty) => specialty.aliases.some((alias) => query.includes(normalize(alias))))?.name
  };
}

function matchesCity(recordCity: string, requestedCity?: string) {
  if (!requestedCity) return true;
  return normalize(recordCity) === normalize(normalizeProviderCity(requestedCity));
}

function matchesSpecialty(recordSpecialties: string[], requestedSpecialty?: string) {
  if (!requestedSpecialty) return true;
  const requested = normalize(normalizeProviderSpecialty(requestedSpecialty));
  return recordSpecialties.some((specialty) => normalize(specialty) === requested);
}

export function searchDemoDoctors(filters: ProviderFilters = {}): ProviderOption[] {
  return demoHospitals.flatMap((hospital) => {
    if (!matchesCity(hospital.city, filters.city)) return [];

    return hospital.doctors
      .filter((doctor) => matchesSpecialty([doctor.specialty], filters.specialty))
      .map((doctor) => ({
        id: doctor.id,
        type: "doctor" as const,
        name: doctor.name,
        nameAr: doctor.nameAr,
        specialty: doctor.specialty,
        specialtyAr: doctor.specialtyAr,
        city: hospital.city,
        cityAr: hospital.cityAr,
        hospitalName: hospital.name,
        hospitalNameAr: hospital.nameAr
      }));
  }).slice(0, 10);
}

export function searchDemoHospitals(filters: ProviderFilters = {}): ProviderOption[] {
  return demoHospitals
    .filter((hospital) => matchesCity(hospital.city, filters.city) && matchesSpecialty(hospital.specialties, filters.specialty))
    .map((hospital) => ({
      id: hospital.id,
      type: "hospital" as const,
      name: hospital.name,
      nameAr: hospital.nameAr,
      city: hospital.city,
      cityAr: hospital.cityAr,
      hospitalName: hospital.name,
      hospitalNameAr: hospital.nameAr
    }))
    .slice(0, 10);
}

export function searchDemoProviders(message: string): ProviderOption[] {
  const filters = extractProviderFilters(message);
  const query = normalize(message);
  const hospitalRequest = ["hospital", "medical center", "clinic", "مستشفى", "مركز طبي", "عيادة"]
    .some((term) => query.includes(normalize(term)));
  const doctorRequest = ["doctor", "physician", "specialist", "دكتور", "طبيب", "استشاري"]
    .some((term) => query.includes(normalize(term)));

  if (hospitalRequest && !doctorRequest) return searchDemoHospitals(filters);
  return searchDemoDoctors(filters);
}