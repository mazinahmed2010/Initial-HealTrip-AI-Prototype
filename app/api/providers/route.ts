import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoHospitals } from "@/lib/provider-data";

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { active: true },
      include: { doctors: { where: { active: true } } }
    });

    if (hospitals.length) return NextResponse.json(hospitals);
  } catch {
    // The demo catalog keeps provider browsing available without PostgreSQL.
  }

  return NextResponse.json(demoHospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    nameAr: hospital.nameAr,
    city: hospital.city,
    address: hospital.address,
    phone: hospital.phone,
    emergency: hospital.emergency,
    specialties: hospital.specialties,
    active: true,
    doctors: hospital.doctors.map((doctor) => ({
      ...doctor,
      city: hospital.city,
      active: true,
      hospitalId: hospital.id
    }))
  })));
}
