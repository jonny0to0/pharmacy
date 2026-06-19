import prisma from "./src/db.js";
async function main() {
    const plans = await prisma.plan.findMany();
    console.log(JSON.stringify(plans, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-plans.js.map