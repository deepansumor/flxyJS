import { local as storage } from "./storage.js";

/**
 * The Device module for handling device information, including unique IDs, capabilities, network info, etc.
 */

// Define the empty Device object
const Device = {
    id: null,  // Unique identifier for the device, stored in localStorage
};

/**
 * Initializes the Device module, generating or retrieving the unique device ID.
 */
export async function init() {
    const existingId = await storage.get("deviceId");
    if (existingId) {
        Device.id = existingId;
    } else {
        Device.id = await generateId();
        await storage.set("deviceId", Device.id);
    }
}

/**
 * Generates a pseudo-unique device identifier.
 * @returns {string} A unique device ID.
 */
export async function generateId() {
    return await hashString(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
}

/**
 * Retrieves the unique device ID.
 * @returns {string} The device ID.
 */
export function getId() {
    return Device.id;
}

/**
 * Retrieves browser-related information.
 * @returns {Object} An object containing browser details.
 */
export function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;

    return { userAgent, platform, language };
}

/**
 * Detects device capabilities.
 * @returns {Object} An object describing device capabilities.
 */
export function getCapabilities() {
    const touchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const screenResolution = {
        width: window.screen.width,
        height: window.screen.height,
    };

    return { touchSupport, screenResolution };
}

/**
 * Retrieves network-related information.
 * @returns {Object} An object describing the network connection.
 */
export function getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
        const { effectiveType, downlink, rtt } = connection;
        return { effectiveType, downlink, rtt };
    }

    return { effectiveType: "unknown", downlink: "unknown", rtt: "unknown" };
}

/**
 * Checks permissions for specified APIs (e.g., geolocation, notifications).
 * @param {string} name - The name of the permission (e.g., 'geolocation').
 * @returns {Promise<string>} Permission status ('granted', 'denied', 'prompt').
 */
export async function checkPermission(name) {
    if (!navigator.permissions) {
        return "unsupported";
    }

    try {
        const status = await navigator.permissions.query({ name });
        return status.state;
    } catch (error) {
        console.error("Permission query error:", error);
        return "error";
    }
}

/**
 * Checks available storage (if supported by the browser).
 * @returns {Promise<Object>} An object containing usage and quota information.
 */
export async function getStorageInfo() {
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const { quota, usage } = await navigator.storage.estimate();
            return { quota, usage };
        } catch (error) {
            console.error("Storage estimation error:", error);
            return { quota: null, usage: null };
        }
    }

    return { quota: null, usage: null };
}

/**
 * Generates a stable browser fingerprint using consistent factors.
 * Avoids dynamic properties like window size.
 * @returns {string} - A unique fingerprint string.
 */
export async function generateFingerprint() {
    // Gather stable browser and device properties
    const components = [
        navigator.userAgent,                     // Browser user agent string
        navigator.language || navigator.languages.join(','), // Language(s) configured
        navigator.platform,                     // Platform/OS
        navigator.hardwareConcurrency || 'N/A', // Number of logical processors
        navigator.deviceMemory || 'N/A',        // Device memory (if available)
        screen.colorDepth,                      // Color depth
        screen.width,                           // Screen width (not window size)
        screen.height,                          // Screen height
        screen.pixelDepth,                      // Pixel depth
        navigator.maxTouchPoints || 0,          // Number of touch points supported
    ];

    // Filter out undefined or null values
    const data = components.filter(Boolean).join('|');

    // Generate a hash (e.g., SHA-256) to create a unique identifier
    return hashString(data);
}

/**
 * Hashes a string using a simple SHA-256 implementation.
 * @param {string} str - Input string to hash.
 * @returns {string} - SHA-256 hash of the input string.
 */
export async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Detects device type (mobile, tablet, etc.) and platform (iOS, Android, etc.).
 * @returns {Object} An object describing device type and platform.
 */
export function getDeviceType() {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isWindows = /Windows/i.test(userAgent);
    const isMac = /Mac/i.test(userAgent);
    const isLinux = /Linux/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    return {
        isMobile,
        isTablet,
        isIOS,
        isAndroid,
        isWindows,
        isMac,
        isLinux,
        isDesktop,
    };
}