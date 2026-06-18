import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  const userId = "ef21411e-0424-4b56-a5cc-769f00cfc531";
  const tenantId = "ec49384a-6f8f-41ab-bdc4-bdb8aac88a2f"; // ZenKins Pharmacy tenant

  console.log("Simulating update for user ID:", userId);

  // Payload sent by frontend:
  const payload = {
    name: "Nasiruddin",
    email: "nasiruddinsaikh2015@gmail.com",
    mobile: "1234567890", // mock mobile or original
    role: "PHARMACIST",
    isActive: true,
    employeeId: "",
    department: "",
    designation: "",
    employmentType: "FULL_TIME",
    joinDate: "2026-06-10",
    salary: "",
    workShift: "",
    branchIds: []
  };

  try {
    const roleToAssign = await prisma.role.findFirst({
      where: { 
        name: payload.role.toUpperCase(),
        OR: [{ tenantId }, { tenantId: null, isSystem: true }]
      }
    });

    console.log("Found roleToAssign:", roleToAssign);

    const updateData = {
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      isActive: payload.isActive,
      employeeId: payload.employeeId || null,
      department: payload.department || null,
      designation: payload.designation || null,
      employmentType: payload.employmentType,
      salary: null,
      workShift: payload.workShift || null,
      updatedAt: new Date()
    };

    if (payload.joinDate) {
      updateData.joinDate = new Date(payload.joinDate);
    }
    if (payload.role) {
      updateData.role = payload.role.toUpperCase();
    }
    if (roleToAssign) {
      updateData.userrole = {
        deleteMany: {},
        create: {
          id: uuidv4(),
          roleId: roleToAssign.id
        }
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userrole: { include: { role: true } }
      }
    });

    console.log("Success! Updated user:", updated);
  } catch (error) {
    console.error("🔥 Error caught during user update:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
