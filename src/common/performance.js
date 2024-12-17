import Emitter from "./emitter.js";

const Performance = {
    logs: [], // Store performance logs
    thresholds: 0, // Minimum duration (in ms) to log or report

    /**
     * Start tracking performance for a specific tag or operation.
     * @param {string} tag - A tag identifying the operation (e.g., 'API', 'Render').
     * @param {object} [details] - Additional details about the operation.
     * @returns {object} - A performance tracker with an `end` method.
     */
    start(tag, details = {}) {
        const startTime = performance.now();
        const tracker = {
            tag,
            details,
            startTime,
            end: () => this.end(tracker),
        };

        return tracker;
    },

    /**
     * End tracking for a specific tracker.
     * @param {object} tracker - The performance tracker to end.
     */
    end(tracker) {
        const endTime = performance.now();
        const duration = endTime - tracker.startTime;

        const log = {
            tag: tracker.tag,
            details: tracker.details,
            startTime: tracker.startTime,
            endTime,
            duration,
        };

        if (duration >= this.thresholds) {
            this.logs.push(log); // Save the log
            this.report(log); // Report or emit the log
        }
    },

    /**
     * Report a performance log.
     * @param {object} log - The log to report.
     */
    report(log) {
        console.info(`[Performance] ${log.tag}: ${log.duration.toFixed(2)}ms`, log.details);
        Emitter.emit("performance:log", log); // Emit performance log event
    },

    /**
     * Get all performance logs.
     * @returns {Array<object>} - The stored performance logs.
     */
    getLogs() {
        return this.logs;
    },

    /**
     * Clear all performance logs.
     */
    clear() {
        this.logs = [];
    },

    /**
     * Set a logging threshold.
     * @param {number} threshold - Minimum duration (in ms) to log or report.
     */
    setThreshold(threshold) {
        this.thresholds = threshold;
    },

    /**
     * Get global performance statistics.
     * @returns {object} - An object containing average, max, and min durations.
     */
    getStats() {
        if (this.logs.length === 0) {
            return { average: 0, max: 0, min: 0 };
        }

        const durations = this.logs.map(log => log.duration);
        const total = durations.reduce((sum, value) => sum + value, 0);

        return {
            average: total / durations.length,
            max: Math.max(...durations),
            min: Math.min(...durations),
        };
    },
};

export default Performance;
