import { PrismaClient, AuditSeverity, IncidentStatus } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("📊 [Analytics] Seeding 60 days of operational incident data...");
    const admins = await prisma.user.findMany({
        where: { roles: { some: { role: { name: 'SUPER_ADMIN' } } } },
        take: 3
    });
    if (admins.length === 0) {
        console.warn("No admins found to assign incidents to. Seed aborted.");
        return;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    const types = ["INTEGRITY", "DATABASE", "PAYMENTS", "SYSTEM", "SECURITY"];
    // Total incidents to generate: approx 150-200 for 60 days
    for (let i = 0; i < 180; i++) {
        const createdAt = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));
        const type = types[Math.floor(Math.random() * types.length)];
        const severity = Math.random() > 0.8 ? 'CRITICAL' : (Math.random() > 0.4 ? 'WARNING' : 'INFO');
        // Pattern: Weekends are slower (higher MTTA/MTTR)
        const isWeekend = createdAt.getDay() === 0 || createdAt.getDay() === 6;
        const baseMtta = isWeekend ? 15 : 3; // mins
        const baseMttr = isWeekend ? 45 : 15; // mins
        // Random noise
        const mttaMins = baseMtta + Math.floor(Math.random() * 10);
        const mttrMins = baseMttr + Math.random() * 60;
        const acknowledgedAt = new Date(createdAt.getTime() + mttaMins * 60000);
        const resolvedAt = new Date(acknowledgedAt.getTime() + mttrMins * 60000);
        const admin = admins[i % admins.length];
        await prisma.incident.create({
            data: {
                message: `[${type}] Generated Operational Event #${i} - ${severity} detected.`,
                severity,
                status: 'RESOLVED',
                cooldownKey: `${type}_MOCK_${i}`,
                createdAt,
                acknowledgedAt,
                resolvedAt,
                assignedToId: admin.id,
                timeline: [
                    { status: 'ACTIVE', timestamp: createdAt },
                    { status: 'ACKNOWLEDGED', timestamp: acknowledgedAt, userId: admin.id },
                    { status: 'RESOLVED', timestamp: resolvedAt, userId: admin.id }
                ],
                notes: [
                    { note: "System auto-recovery verified.", timestamp: resolvedAt, userId: 'SYSTEM' }
                ],
                runbookUrl: `https://docs.medisynex.com/runbooks/${type.toLowerCase()}`
            }
        });
    }
    console.log("✅ [Analytics] Seeded 180 incidents with varied MTTA/MTTR patterns.");
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=generateAnalyticsMockData.js.map