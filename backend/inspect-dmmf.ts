import { Prisma } from "@prisma/client";

async function main() {
  const dmmf = (Prisma as any).dmmf;
  const models = dmmf.datamodel.models;
  const tenantModel = models.find((m: any) => m.name.toLowerCase() === "tenant");
  
  if (tenantModel) {
    console.log("Model Name:", tenantModel.name);
    console.log("Fields:", tenantModel.fields.map((f: any) => f.name).join(", "));
  } else {
    console.log("Tenant model not found in DMMF!");
    console.log("Available models:", models.map((m: any) => m.name).join(", "));
  }
}

main().catch(console.error);
