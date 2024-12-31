import Mustache from "mustache";
import STATES from "../utils/states.js";
import { translate } from "./translator.js";
import { isObject } from "./helpers.js";

// Configuration object
const Template = {
    prefix: `${window.location.origin}/templates`, // Base URL for templates
    caches: new Map(),              // Cache storage for templates
    extension: '.html',             // File extension for templates
    container: document.body,
    metric: null,
    engine: Mustache,
    config: {}
};

// Set the Prefix of domain
export function setPrefix(prefix) {
    Template.prefix = prefix;
}

// export engine 
export const engine = Template.engine;

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
 * Fetches the translated HTML for a given template path, processes the template with the provided data,
 * and incorporates partials if specified.
 *
 * @param {string} path - The path of the template to fetch. The template is expected to be preloaded in the cache.
 * @param {Object} data - The data object to inject into the template for dynamic content rendering.
 * @param {Object} [partials={}] - Optional partial templates to be included in the main template during rendering.
 * @param {Object} [tags] - Optional custom tags to be passed for template rendering (e.g., custom delimiters).
 * @returns {Promise<string>} - A Promise that resolves to the fully translated HTML, including injected data and rendered partials.
 *
 * Workflow:
 * - Ensures the provided `data` is valid and combines it with default configuration data.
 * - Preloads the main template if it's not already loaded.
 * - Retrieves the template source from the cache and processes it.
 * - Returns the translated HTML after processing.
 *
 * @throws {Error} If the template for the specified path is not found in the cache or if the `data` is not valid.
 */

export async function getHTML(path, data , partials = {} , tags) {
    data = data || {};
    if (!isObject(data)) {
        throw new Error(`data must be an object`);
    }

    // Preload the main template if not already loaded
    await preload([path]);

    // Fetch the main template source from the cache
    const templateSource = Template.caches.get(path);
    if (!templateSource) {
        throw new Error(`Template for path "${path}" not found.`);
    }

    // Merge default data with the provided data
    const defaults = isObject(Template.config.defaults) ? Template.config.defaults : {};
    data = { ...data, ...defaults };

    //  main template, then parse and translate
    const combinedHTML = templateSource;
    const parsedHtml = await parseTemplate(combinedHTML, data , partials , tags);

    return translate(parsedHtml, data);
}

/**
 * Renders a template into the container using the given path and data.
 *
 * @param {string} path - The path to fetch the template from.
 * @param {Object} data - The data to inject into the template.
 * @param {Object} partials - Partials to include in the rendering process. 
 *                            If keys point to objects, templates are preloaded. 
 *                            If keys point to strings, they are used directly.
 * @param {Object} tags - Custom tags for the template engine, if any.
 */
export async function render(path, data, partials = {}, tags) {
    try {
        // Show loading state on the container
        Template.container.classList.add('loading');

        // Ensure partials is an object
        partials = isObject(partials) ? partials : {};

        // Process partials: preload templates if values are objects
        const processedPartials = {};
        const preloadPromises = [];

        for (const [key, value] of Object.entries(partials)) {
            if (typeof value === "string") {
                // If value is a string, use it directly
                processedPartials[key] = value;
            } else if (isObject(value) && value.path) {
                // If value is an object with a `path`, preload the template
                preloadPromises.push(
                    preload([value.path]).then(() => {
                        const template = Template.caches.get(value.path);
                        if (!template) {
                            throw new Error(`Partial template for "${value.path}" not found.`);
                        }
                        processedPartials[key] = template;
                    })
                );
            }
        }

        // Wait for all partials to preload
        await Promise.all(preloadPromises);

        // Fetch the translated HTML
        const html = await getHTML(path, data, processedPartials, tags);

        // Inject the HTML into the container
        Template.container.innerHTML = html;

        // Remove loading state and add template-specific class
        Template.container.classList.remove('loading');
        Template.container.classList.add(`template${path.replaceAll('/', '-')}`);
    } catch (error) {
        console.error(`Failed to render template for path "${path}":`, error);
    }
}



/**
 * Parses a raw template string using the configured template engine and injects the provided data.
 *
 * @param {string} templateSource - The raw template string to be processed and rendered.
 * @param {Object} data - The data object to inject into the template for dynamic content rendering.
 * @param {Object} [partials={}] - Optional partial templates to be included in the main template during rendering.
 * @param {Object} [tags] - Optional custom tags to be passed for template rendering (e.g., custom delimiters).
 * @returns {string} - The parsed HTML string with the injected data and rendered partials.
 *
 * Workflow:
 * - Compiles the raw template using the template engine and the provided data, partials, and tags.
 * - Returns the rendered HTML with the injected content.
 */

export async function parseTemplate(templateSource, data , partials = {},tags) {
    const template = Template.engine.render(templateSource, data , partials, tags);  // Compile engine template
    return template;  // Return the rendered HTML
}

// Export cache-related functions
export const cache = {
    add: addToCache,
    delete: deleteFromCache,
    refresh: refreshCache
};

/**
 * Sets the configuration for the Template module.
 * 
 * @param {Object} config - The configuration object to set. Defaults to an empty object if no argument is provided.
 * 
 * Note:
 * - If the provided `config` is not an object, the function will exit without making any changes.
 * - Updates the `Template.config` property with the provided configuration object.
 */
export function setConfig(config = {}) {
    // Ensure the passed argument is an object; exit otherwise
    if (typeof config != "object") return;

    // Assign the provided configuration object to the Template's config property
    Template.config = config;
}

export const setContainer = (container) => Template.container = container;