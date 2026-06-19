import { Prisma } from "@prisma/client";
async function main() {
    const dmmf = Prisma.dmmf;
    const models = dmmf.datamodel.models;
    const tenantModel = models.find((m) => m.name.toLowerCase() === "tenant");
    if (tenantModel) {
        console.log("Model Name:", tenantModel.name);
        console.log("Fields:", tenantModel.fields.map((f) => f.name).join(", "));
    }
    else {
        console.log("Tenant model not found in DMMF!");
        console.log("Available models:", models.map((m) => m.name).join(", "));
    }
}
main().catch(console.error);
//# sourceMappingURL=inspect-dmmf.js.map