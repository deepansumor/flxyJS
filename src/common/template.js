import Mustache from "mustache";
import STATES from "../utils/states.js";
import { translate } from "./translator.js";

// Configuration object
const Template = {
    prefix: `${window.location.origin}/templates`, // Base URL for templates
    caches: new Map(),              // Cache storage for templates
    extension: '.html',             // File extension for templates
    container: document.body,
    metric: null,
    Engine:Mustache
};



/**
 * Fetch the template from the provided URL
 * @param {string} url - The URL to fetch the template from.
 * @returns {string} - The raw template string or empty string if fetch fails.
 */
export async function get(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch template from ${url}`);
        }
        return await response.text();  // Return raw template string
    } catch (error) {
        console.error("Error fetching template:", error);
        return ''; // Return an empty string if fetch fails
    }
}

/**
 * Preload an array of paths and fetch their templates
 * @param {Array<string>} paths - An array of template paths to preload and cache.
 */
export async function preload(paths) {
    for (let path of paths) {
        if (!Template.caches.has(path)) {
            const fullPath = `${Template.prefix}${path}${Template.extension}`;
            try {
                Template.caches.set(path, STATES.FETCHING);
                const template = await get(fullPath);
                if (template) {
                    Template.caches.set(path, template);  // Add template to cache
                }
            } catch (error) {
                Template.caches.delete(path);
                console.error(`Failed to preload template at path ${path}:`, error);
            }
        } else {
            console.log(`Template ${path} is Already Loaded`);
        }
    }
}


/**
 * Cache management: Add a template to the cache
 * @param {string} path - The path for the template.
 * @param {string} template - The raw template string.
 */
export function addToCache(path, template) {
    Template.caches.set(path, template);  // Add to the cache map
}

/**
 * Cache management: Delete a template from the cache
 * @param {string} path - The path of the template to delete.
 */
export function deleteFromCache(path) {
    Template.caches.delete(path);  // Delete the template from the cache map
}

/**
 * Cache management: Refresh a template by re-fetching and updating the cache
 * @param {string} path - The path of the template to refresh.
 */
export async function refreshCache(path) {
    const fullPath = `${Template.prefix}${path}${Template.extension}`;
    try {
        const newTemplate = await get(fullPath);
        if (newTemplate) {
            addToCache(path, newTemplate);  // Update cache with new template
        }
    } catch (error) {
        console.error(`Error refreshing template at ${path}:`, error);
    }
}

/**
 * Render a template for a given path and data
 * @param {string} path - The path to fetch the template for.
 * @param {Object} data - The data to inject into the template.
 * @param {string} targetElementId - The ID of the HTML element to inject the rendered template into.
 */
export async function render(path, data) {
    Template.container.classList.add('loading');
    await preload([path]);  // Preload template if not already loaded

    const templateSource = Template.caches.get(path);
    if (!templateSource) {
        console.error(`Template for path ${path} not found.`);
        return '';
    }

    const parsedHtml = await parseTemplate(templateSource, data);
    Template.container.innerHTML = await translate(parsedHtml, data);
    Template.container.classList.remove('loading');
    Template.container.classList.add(`template${path.replaceAll('/', '-')}`);
}

/**
 * Parse the raw template string with Engine and inject data
 * @param {string} templateSource - The raw template string.
 * @param {Object} data - The data to inject into the template.
 * @returns {string} - The parsed HTML with injected data.
 */
export async function parseTemplate(templateSource, data) {
    const template = Template.Engine.render(templateSource,data);  // Compile Engine template
    return template;  // Return the rendered HTML
}

// Export cache-related functions
export const cache = {
    add: addToCache,
    delete: deleteFromCache,
    refresh: refreshCache
};


export const setContainer = (container) => Template.container = container;