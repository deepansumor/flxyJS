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
    engine: Mustache,
    config: {}
};

// Set the Prefix of domain
export function setPrefix (prefix){
    Template.prefix = prefix;
}

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
 * Render a template for a given path with provided data and inject it into the specified target container.
 *
 * @param {string} path - The path to fetch the template from. The template is expected to be cached or preloaded.
 * @param {Object} data - The data to inject into the template, replacing placeholders.
 * 
 * Workflow:
 * 1. Adds a loading class to indicate rendering is in progress.
 * 2. Preloads the main template and optional header/footer templates if configured.
 * 3. Combines the header, main template, and footer, then parses and translates the template.
 * 4. Renders the final HTML into the container and applies the appropriate classes.
 * 
 * Notes:
 * - Requires `Template.config` to specify optional `header` and `footer` templates.
 * - Templates are fetched from `Template.caches`, which should be prepopulated.
 * - Adds a class `template[path-reformatted]` to the container for custom styling or identification.
 * 
 * @throws {Error} If the template for the specified path is not found in the cache.
 */
export async function render(path, data) {
    // Show loading state on the container
    Template.container.classList.add('loading');

    // Preload the main template if not already loaded
    await preload([path]);

    // Initialize header and footer HTML
    let footerHTML = "";
    let headerHTML = "";

    // Check if Template.config is an object and preload header/footer if specified
    if (typeof Template.config === "object") {
        const { header, footer } = Template.config;
        const preloads = [];
        
        if (header) preloads.push(header);
        if (footer) preloads.push(footer);
        
        // Preload header and footer templates
        await preload(preloads);

        // Fetch header and footer templates from the cache
        headerHTML = header ? await Template.caches.get(header) : "";
        footerHTML = footer ? await Template.caches.get(footer) : "";
    }

    // Fetch the main template source from the cache
    const templateSource = Template.caches.get(path);
    if (!templateSource) {
        console.error(`Template for path "${path}" not found.`);
        return '';
    }

    // Combine header, main template, and footer, then parse and translate
    const parsedHtml = await parseTemplate(headerHTML + templateSource + footerHTML, data);
    Template.container.innerHTML = await translate(parsedHtml, data);

    // Remove loading state and add template-specific class
    Template.container.classList.remove('loading');
    Template.container.classList.add(`template${path.replaceAll('/', '-')}`);
}


/**
 * Parse the raw template string with engine and inject data
 * @param {string} templateSource - The raw template string.
 * @param {Object} data - The data to inject into the template.
 * @returns {string} - The parsed HTML with injected data.
 */
export async function parseTemplate(templateSource, data) {
    const template = Template.engine.render(templateSource, data);  // Compile engine template
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