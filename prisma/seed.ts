import { PrismaClient } from "@prisma/client";
import { demoHospitals } from "../lib/provider-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();

  for (const hospital of demoHospitals) {
    await prisma.hospital.create({
      data: {
        name: hospital.name,
        nameAr: hospital.nameAr,
        city: hospital.city,
        address: hospital.address,
        phone: hospital.phone,
        emergency: hospital.emergency,
        specialties: hospital.specialties,
        doctors: {
          create: hospital.doctors.map((doctor) => ({
            name: doctor.name,
            nameAr: doctor.nameAr,
            specialty: doctor.specialty,
            specialtyAr: doctor.specialtyAr,
            city: hospital.city,
            languages: doctor.languages
          }))
        }
      }
    });
  }

  const doctorCount = demoHospitals.reduce((count, hospital) => count + hospital.doctors.length, 0);
  console.log(`Seeded ${demoHospitals.length} demo hospitals and ${doctorCount} demo doctors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
