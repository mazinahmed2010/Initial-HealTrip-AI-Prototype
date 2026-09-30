import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hospitals = await prisma.hospital.findMany({
    where: { active: true },
    include: { doctors: { where: { active: true } } }
  });

  return NextResponse.json(hospitals);
}
