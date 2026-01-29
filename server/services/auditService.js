const prisma = require('../db');

class AuditService {

    /**
     * Log a system activity (Non-blocking / Fire-and-forget)
     */
    async log(params) {
        const { userId, action, entityType, entityId, details, req } = params;

        // Fire and forget - don't await to avoid blocking main thread
        prisma.auditLog.create({
            data: {
                user_id: userId || null,
                action,
                entity_type: entityType,
                entity_id: entityId || null,
                details: details || {},
                ip_address: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
                user_agent: req ? req.headers['user-agent'] : null
            }
        }).catch(error => {
            console.error('❌ Audit logging failed:', error);
        });

        return true;
    }

    /**
     * Track an update with old vs new comparison
     */
    async logUpdate(userId, entityType, entityId, oldData, newData, req) {
        // Simple diff logic
        const changes = {};
        for (const key in newData) {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                changes[key] = {
                    old: oldData[key],
                    new: newData[key]
                };
            }
        }

        if (Object.keys(changes).length === 0) return;

        return await this.log({
            userId,
            action: 'UPDATE',
            entityType,
            entityId,
            details: { changes },
            req
        });
    }

    /**
     * Fetch logs with filters
     */
    async getLogs(filters = {}, limit = 100, offset = 0) {
        return await prisma.auditLog.findMany({
            where: filters,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' }
        });
    }
}

module.exports = new AuditService();
