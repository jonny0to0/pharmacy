import { Prisma } from "@prisma/client";

async function main() {
  const dmmf = (Prisma as any).dmmf;
  const userModel = dmmf.datamodel.models.find((m: any) => m.name === "user");
  const updatedAtField = userModel.fields.find((f: any) => f.name === "updatedAt");
  
  console.log("UpdatedAt Field DMMF:", JSON.stringify(updatedAtField, null, 2));
  
  // Check Create Input
  const userCreateInput = dmmf.schema.inputObjectTypes.prisma.find((t: any) => t.name === "userCreateInput");
  const updatedAtInCreate = userCreateInput?.fields.find((f: any) => f.name === "updatedAt");
  console.log("UpdatedAt in userCreateInput:", updatedAtInCreate ? "FOUND" : "NOT FOUND");
}

main().catch(console.error);
