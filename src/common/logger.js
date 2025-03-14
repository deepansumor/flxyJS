const Logger = {
    enabled: true, // Global logging toggle
    level: "info", // Default log level ("debug", "info", "warn", "error")
    performance: new Map(), // Stores performance tracking data
    externalEndpoint: null, // Optional external logging endpoint
};

/**
 * Sets the logging configuration.
 * @param {Object} config - Configuration object.
 */
export function setConfig(config = {}) {
    if (typeof config !== "object") return;
    Object.assign(Logger, config);
}

/**
 * General log function.
 * @param {string} level - Log level.
 * @param {string} message - Log message.
 * @param {Object} [data] - Additional data.
 */
function log(level, message, data = {}) {
    if (!Logger.enabled || ["debug", "info", "warn", "error"].indexOf(level) < 0) return;
    if (level === "debug" && Logger.level !== "debug") return; // Debug logs only when enabled

    console[level](`[Flxy.js] [${level.toUpperCase()}]`, message, data);
    if (Logger.externalEndpoint) sendToExternalLogger(level, message, data);
}

// Specific log functions
export const debug = (msg, data) => log("debug", msg, data);
export const info = (msg, data) => log("info", msg, data);
export const warn = (msg, data) => log("warn", msg, data);
export const error = (msg, data) => log("error", msg, data);

/**
 * Tracks state changes.
 * @param {string} stateName - Name of the state.
 * @param {any} oldValue - Previous state value.
 * @param {any} newValue - New state value.
 */
export function trackStateChange(stateName, oldValue, newValue) {
    debug(`State changed: ${stateName}`, { oldValue, newValue });
}

/**
 * Starts performance tracking for a given label.
 * @param {string} label - Identifier for performance tracking.
 */
export function startPerformance(label) {
    Logger.performance.set(label, performance.now());
}

/**
 * Ends performance tracking and logs the result.
 * @param {string} label - Identifier for performance tracking.
 */
export function endPerformance(label) {
    if (!Logger.performance.has(label)) return;
    const startTime = Logger.performance.get(label);
    const duration = performance.now() - startTime;
    Logger.performance.delete(label);
    info(`Performance: ${label} took ${duration.toFixed(2)}ms`);
}

/**
 * Sends log data to an external logging service.
 * @param {string} level - Log level.
 * @param {string} message - Log message.
 * @param {Object} data - Additional data.
 */
async function sendToExternalLogger(level, message, data) {
    try {
        await fetch(Logger.externalEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level, message, data, timestamp: new Date().toISOString() }),
        });
    } catch (err) {
        warn("Failed to send log to external endpoint", err);
    }
}
