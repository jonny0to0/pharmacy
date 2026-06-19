import prisma from "../db.js";
class ConsoleProvider {
    async send(message, severity) {
        const icon = severity === 'CRITICAL' ? '🚨' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
        const logFn = (severity === 'CRITICAL' || severity === 'WARNING') ? console.error : console.log;
        logFn(`\n${icon} [OPERATIONS][${severity}] ${message}\n`);
    }
}
const RUNBOOKS = {
    'INTEGRITY': '/data/runbooks/audit_integrity_failure.md',
    'DATABASE': '/data/runbooks/database_outage.md',
    'ERROR_RATE': '/data/runbooks/high_error_rate.md',
    'PAYMENTS': '/data/runbooks/payment_failure_spike.md',
    'SECURITY': '/data/runbooks/impersonation_misuse.md',
    'AUTH': '/data/runbooks/impersonation_misuse.md',
    'DEFAULT': '/data/runbooks/general_recovery.md'
};
export class AlertingService {
    static providers = [];
    static cooldowns = new Map();
    static initialize() {
        if (this.providers.length > 0)
            return;
        this.providers.push(new ConsoleProvider());
    }
    /**
     * Internal notify: persist to DB and dispatch to providers
     */
    static async notify(message, severity = 'INFO', cooldownKey) {
        this.initialize();
        // 1. Deduplication (Memory-shield to prevent DB hammering)
        if (cooldownKey) {
            const lastSent = this.cooldowns.get(cooldownKey) || 0;
            if (Date.now() - lastSent < 1 * 60 * 1000) { // 1 min memory cooldown
                const existing = await prisma.incident.findFirst({
                    where: { cooldownKey, status: { not: 'RESOLVED' } }
                });
                if (existing) {
                    await prisma.incident.update({
                        where: { id: existing.id },
                        data: {
                            count: { increment: 1 },
                            updatedAt: new Date()
                        }
                    });
                    return;
                }
            }
            this.cooldowns.set(cooldownKey, Date.now());
        }
        // 2. Identify Runbook
        let runbookUrl = RUNBOOKS.DEFAULT;
        const upperMsg = message.toUpperCase();
        if (upperMsg.includes('INTEGRITY') || upperMsg.includes('BREACH'))
            runbookUrl = RUNBOOKS.INTEGRITY;
        else if (upperMsg.includes('DB') || upperMsg.includes('DATABASE'))
            runbookUrl = RUNBOOKS.DATABASE;
        else if (upperMsg.includes('PAYMENT'))
            runbookUrl = RUNBOOKS.PAYMENTS;
        else if (upperMsg.includes('SECURITY') || upperMsg.includes('AUTH'))
            runbookUrl = RUNBOOKS.SECURITY;
        // 3. Persist Incident
        const incident = await prisma.incident.create({
            data: {
                message,
                severity,
                status: 'ACTIVE',
                cooldownKey,
                runbookUrl,
                timeline: [{ status: 'ACTIVE', time: new Date().toISOString(), event: 'Incident Created' }]
            }
        });
        // 4. Dispatch
        const promises = this.providers.map(p => p.send(`[${incident.id}] ${message}`, severity));
        await Promise.all(promises);
        return incident;
    }
    /**
     * Operational Transition: Assign Ownership (Acknowledgment)
     */
    static async assign(id, adminId) {
        const incident = await prisma.incident.findUnique({ where: { id } });
        if (!incident)
            throw new Error("Incident not found");
        const now = new Date();
        const timeline = incident.timeline || [];
        // Calculate MTTA (Time to Ack)
        const mttaMs = now.getTime() - incident.createdAt.getTime();
        const mttaSec = (mttaMs / 1000).toFixed(1);
        timeline.push({
            status: incident.status,
            time: now.toISOString(),
            event: `Assigned to ${adminId}. Ack Time: ${mttaSec}s`
        });
        return await prisma.incident.update({
            where: { id },
            data: {
                assignedToId: adminId,
                status: incident.status === 'ACTIVE' ? 'ACKNOWLEDGED' : incident.status,
                acknowledgedAt: incident.status === 'ACTIVE' ? now : incident.acknowledgedAt,
                timeline
            }
        });
    }
    /**
     * Operational Transition: Resolve
     */
    static async resolve(id) {
        const incident = await prisma.incident.findUnique({ where: { id } });
        if (!incident)
            return;
        const now = new Date();
        const timeline = incident.timeline || [];
        // Calculate MTTR (Time to Resolve)
        const mttrMs = now.getTime() - incident.createdAt.getTime();
        const mttrMin = (mttrMs / 60000).toFixed(1);
        timeline.push({
            status: 'RESOLVED',
            time: now.toISOString(),
            event: `Incident Resolved. Total Time: ${mttrMin}m`
        });
        return await prisma.incident.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolvedAt: now,
                timeline
            }
        });
    }
    static async getActiveIncidents() {
        return await prisma.incident.findMany({
            where: { status: { not: 'RESOLVED' } },
            include: {
                user: { select: { name: true, id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Operational Intelligence Engine
     * Generates actionable insights from historical incident data.
     */
    static async getIntelligenceReport() {
        const totalIncidents = await prisma.incident.count();
        const resolved = await prisma.incident.findMany({ where: { status: 'RESOLVED' } });
        // 1. SLA Breach Rate (Criticals)
        const criticals = await prisma.incident.findMany({ where: { severity: 'CRITICAL' } });
        const breaches = criticals.filter(c => {
            if (!c.acknowledgedAt)
                return false;
            return (c.acknowledgedAt.getTime() - c.createdAt.getTime()) > 5 * 60000;
        });
        const slaBreachRate = criticals.length > 0 ? ((breaches.length / criticals.length) * 100).toFixed(1) : "0.0";
        // 2. Slowest Categories (by Runbook / Type)
        const typeAnalysis = {};
        resolved.forEach(r => {
            const type = r.runbookUrl?.split('/').pop()?.replace('.md', '') || 'unknown';
            const mttr = (r.resolvedAt.getTime() - r.createdAt.getTime()) / 60000;
            if (!typeAnalysis[type])
                typeAnalysis[type] = { total: 0, sumMttr: 0 };
            typeAnalysis[type].total++;
            typeAnalysis[type].sumMttr += mttr;
        });
        const slowestCategories = Object.entries(typeAnalysis)
            .map(([name, stats]) => ({ name, avgMttr: (stats.sumMttr / stats.total).toFixed(1) }))
            .sort((a, b) => Number(b.avgMttr) - Number(a.avgMttr))
            .slice(0, 3);
        // 3. Top Recurring Hotspots
        const hotspots = await prisma.incident.groupBy({
            by: ['cooldownKey'],
            _count: { _all: true },
            where: { cooldownKey: { not: null } },
            orderBy: { _count: { cooldownKey: 'desc' } },
            take: 5
        });
        return {
            totalIncidents,
            slaBreachRate: `${slaBreachRate}%`,
            slowestCategories,
            hotspots: hotspots.map(h => ({ key: h.cooldownKey, count: h._count._all })),
            targetSla: "< 2.0%"
        };
    }
    /**
     * SLA Monitoring Poller
     * Check for:
     * - ACTIVE CRITICAL incidents older than 5 minutes (Ack target)
     * - ACTIVE WARNING incidents older than 15 minutes (Escalation target)
     */
    static async runEscalationCheck() {
        const now = new Date();
        const staleCriticals = await prisma.incident.findMany({
            where: {
                status: 'ACTIVE',
                severity: 'CRITICAL',
                createdAt: { lt: new Date(now.getTime() - 5 * 60 * 1000) }
            }
        });
        for (const incident of staleCriticals) {
            await this.notify(`[SLA BREACH] Critical Incident ${incident.id} unacknowledged for > 5m!`, 'CRITICAL', `SLA_BREACH_${incident.id}`);
        }
        const staleWarnings = await prisma.incident.findMany({
            where: {
                status: 'ACTIVE',
                severity: 'WARNING',
                createdAt: { lt: new Date(now.getTime() - 15 * 60 * 1000) }
            }
        });
        for (const incident of staleWarnings) {
            await prisma.incident.update({
                where: { id: incident.id },
                data: {
                    severity: 'CRITICAL',
                    message: `[ESCALATED] ${incident.message}`
                }
            });
            await this.notify(`[ESCALATION] Warning escalated to Critical: ${incident.id}`, 'CRITICAL', `ESCALATE_${incident.id}`);
        }
    }
}
//# sourceMappingURL=AlertingService.js.map