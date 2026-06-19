import { Prisma } from "@prisma/client";
async function main() {
    const dmmf = Prisma.dmmf;
    const models = dmmf.datamodel.models;
    const tenantModel = models.find((m) => m.name.toLowerCase() === "tenant");
    if (tenantModel) {
        const idField = tenantModel.fields.find((f) => f.name === "id");
        console.log("ID Field:", JSON.stringify(idField, null, 2));
    }
}
main().catch(console.error);
//# sourceMappingURL=inspect-id-field.js.map