import { emit } from "./emitter.js";


/**
 * The Performance module for handling performance tracking and logging.
 */

// Define the Performance object on top
const Performance = {
    logs: [], // Store performance logs
    thresholds: 0, // Minimum duration (in ms) to log or report
};

/**
 * Start tracking performance for a specific tag or operation.
 * @param {string} tag - A tag identifying the operation (e.g., 'API', 'Render').
 * @param {object} [details] - Additional details about the operation.
 * @returns {object} - A performance tracker with an `end` method.
 */
export function start(tag, details = {}) {
    const startTime = performance.now();
    const tracker = {
        tag,
        details,
        startTime,
        end: () => end(tracker),
    };

    return tracker;
}

/**
 * End tracking for a specific tracker.
 * @param {object} tracker - The performance tracker to end.
 */
export function end(tracker) {
    const endTime = performance.now();
    const duration = endTime - tracker.startTime;

    const log = {
        tag: tracker.tag,
        details: tracker.details,
        startTime: tracker.startTime,
        endTime,
        duration,
    };

    if (duration >= Performance.thresholds) {
        Performance.logs.push(log); // Save the log
        report(log); // Report or emit the log
    }
}

/**
 * Report a performance log.
 * @param {object} log - The log to report.
 */
export function report(log) {
    console.info(`[Performance] ${log.tag}: ${log.duration.toFixed(2)}ms`, log.details);
    emit("performance:log", log); // Emit performance log event
}

/**
 * Get all performance logs.
 * @returns {Array<object>} - The stored performance logs.
 */
export function getLogs() {
    return Performance.logs;
}

/**
 * Clear all performance logs.
 */
export function clear() {
    Performance.logs.length = 0;
}
