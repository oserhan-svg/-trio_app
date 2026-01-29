const prisma = require('../db');

class TaskOrchestratorService {

    /**
     * Queue a new job
     */
    async enqueue(jobType, payload, nextRunAt = new Date()) {
        return await prisma.backgroundJob.create({
            data: {
                job_type: jobType,
                payload: payload,
                next_run_at: nextRunAt
            }
        });
    }

    /**
     * Process pending jobs (to be called by a cron or interval)
     */
    async processJobs() {
        const pendingJobs = await prisma.backgroundJob.findMany({
            where: {
                status: { in: ['pending', 'failed'] },
                next_run_at: { lte: new Date() },
                attempts: { lt: prisma.backgroundJob.fields.max_attempts }
            },
            take: 5 // Process in small batches to avoid overload
        });

        for (const job of pendingJobs) {
            await this.runJob(job);
        }
    }

    async runJob(job) {
        // Mark as processing
        await prisma.backgroundJob.update({
            where: { id: job.id },
            data: {
                status: 'processing',
                attempts: { increment: 1 }
            }
        });

        try {
            let result = null;

            // Execute based on type
            switch (job.job_type) {
                case 'scraper_sync':
                    // result = await scraperSync.run(job.payload);
                    break;
                case 'ai_matching':
                    // result = await aiService.runGlobalMatching();
                    break;
                case 'roi_recalc':
                    // result = await appraisalService.recalculateAll();
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.job_type}`);
            }

            // Success
            await prisma.backgroundJob.update({
                where: { id: job.id },
                data: {
                    status: 'completed',
                    result: result || { success: true }
                }
            });

        } catch (error) {
            console.error(`❌ Job #${job.id} failed:`, error);

            const isFinalAttempt = job.attempts + 1 >= job.max_attempts;

            await prisma.backgroundJob.update({
                where: { id: job.id },
                data: {
                    status: isFinalAttempt ? 'failed' : 'pending',
                    error: error.message,
                    // Exponential backoff for retry
                    next_run_at: new Date(Date.now() + Math.pow(2, job.attempts) * 60000)
                }
            });
        }
    }

    /**
     * Clean up old completed jobs
     */
    async cleanup() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await prisma.backgroundJob.deleteMany({
            where: {
                status: 'completed',
                created_at: { lt: sevenDaysAgo }
            }
        });
    }
}

module.exports = new TaskOrchestratorService();
