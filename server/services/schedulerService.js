const AutoTrainService = require('./AutoTrainService');
const aiLearningService = require('./aiLearningService');

class SchedulerService {
    constructor() {
        this.intervals = [];
    }

    /**
     * Start all scheduled tasks
     */
    start() {
        console.log('📅 Scheduler Service Starting...');

        // Run AI Optimization every 6 hours
        this.scheduleTask('AI Optimization', () => {
            return aiLearningService.runOptimization();
        }, 6 * 60 * 60 * 1000); // 6 hours

        // Run AutoTrain Analysis every 12 hours (nightly + midday)
        this.scheduleTask('AutoTrain Analysis', () => {
            return AutoTrainService.runNightlyAnalysis();
        }, 12 * 60 * 60 * 1000); // 12 hours

        // Run Stale Lead Detection every 3 hours
        this.scheduleTask('Stale Lead Detection', () => {
            return aiLearningService.detectStaleLeads();
        }, 3 * 60 * 60 * 1000); // 3 hours

        console.log('✅ Scheduler Service Active - All tasks scheduled');
    }

    /**
     * Schedule a recurring task
     */
    scheduleTask(name, taskFunction, intervalMs) {
        console.log(`⏰ Scheduling "${name}" to run every ${intervalMs / (60 * 60 * 1000)}h`);

        // Run immediately on first start (with delay to prevent startup overload)
        setTimeout(async () => {
            try {
                console.log(`🔄 Running initial ${name}...`);
                await taskFunction();
                console.log(`✅ Initial ${name} completed`);
            } catch (error) {
                console.error(`❌ Initial ${name} failed:`, error.message);
            }
        }, 30000); // 30 seconds delay on startup

        // Then schedule recurring execution
        const interval = setInterval(async () => {
            try {
                console.log(`🔄 Running scheduled ${name}...`);
                const startTime = Date.now();
                await taskFunction();
                const duration = Date.now() - startTime;
                console.log(`✅ ${name} completed in ${duration}ms`);
            } catch (error) {
                console.error(`❌ Scheduled ${name} failed:`, error.message);
            }
        }, intervalMs);

        this.intervals.push({ name, interval });
    }

    /**
     * Stop all scheduled tasks
     */
    stop() {
        console.log('🛑 Stopping Scheduler Service...');
        this.intervals.forEach(({ name, interval }) => {
            clearInterval(interval);
            console.log(`⏸️ Stopped: ${name}`);
        });
        this.intervals = [];
    }
}

module.exports = new SchedulerService();
