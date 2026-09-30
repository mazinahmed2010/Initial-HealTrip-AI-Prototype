import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();

  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        name: "HealTrip Medical Center",
        nameAr: "مركز هيل تريب الطبي",
        city: "Riyadh",
        address: "King Fahd Road, Riyadh",
        phone: "+966 11 555 1000",
        emergency: true,
        specialties: ["Cardiology", "Internal Medicine", "Emergency Medicine"]
      }
    }),
    prisma.hospital.create({
      data: {
        name: "Al Noor Specialist Hospital",
        nameAr: "مستشفى النور التخصصي",
        city: "Jeddah",
        address: "Al Madinah Road, Jeddah",
        phone: "+966 12 555 2000",
        emergency: true,
        specialties: ["Cardiology", "Internal Medicine", "Neurology"]
      }
    }),
    prisma.hospital.create({
      data: {
        name: "Qassim Care Hospital",
        nameAr: "مستشفى القصيم كير",
        city: "Buraydah",
        address: "King Abdullah Road, Buraydah",
        phone: "+966 16 555 3000",
        emergency: false,
        specialties: ["Cardiology", "Internal Medicine", "Orthopedics"]
      }
    })
  ]);

  await prisma.doctor.createMany({
    data: [
      {
        name: "Dr. Omar Hassan",
        nameAr: "د. عمر حسن",
        specialty: "Cardiology",
        specialtyAr: "أمراض القلب",
        city: "Riyadh",
        languages: ["English", "Arabic"],
        hospitalId: hospitals[0].id
      },
      {
        name: "Dr. Sara Khalid",
        nameAr: "د. سارة خالد",
        specialty: "Internal Medicine",
        specialtyAr: "الباطنية",
        city: "Riyadh",
        languages: ["Arabic", "English"],
        hospitalId: hospitals[0].id
      },
      {
        name: "Dr. Lina Ahmed",
        nameAr: "د. لينا أحمد",
        specialty: "Cardiology",
        specialtyAr: "أمراض القلب",
        city: "Jeddah",
        languages: ["Arabic", "English"],
        hospitalId: hospitals[1].id
      },
      {
        name: "Dr. Faisal Ali",
        nameAr: "د. فيصل علي",
        specialty: "Internal Medicine",
        specialtyAr: "الباطنية",
        city: "Buraydah",
        languages: ["Arabic"],
        hospitalId: hospitals[2].id
      }
    ]
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
