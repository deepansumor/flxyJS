import Handlebars from "https://cdn.jsdelivr.net/npm/handlebars@4.7.8/+esm";
import Translator from "./translator.js";



// Configuration object
const Template = {
    prefix: window.location.origin, // Base URL for templates
    caches: new Map(),              // Cache storage for templates
    extension: '.html',             // File extension for templates
    Handlebars:Handlebars,
    container : null,

    /**
     * Preload an array of paths and fetch their templates
     * @param {Array<string>} paths - An array of template paths to preload and cache.
     */
    async preload(paths) {
        for (let path of paths) {
            if (!this.caches.has(path)) {
                const fullPath = `${this.prefix}${path}${this.extension}`;
                try {
                    const template = await this.fetch(fullPath);
                    if (template) {
                        this.cache.add(path, template);  // Add template to cache
                    }
                } catch (error) {
                    console.error(`Failed to preload template at path ${path}:`, error);
                }
            }
        }
    },

    /**
     * Fetch the template from the provided URL
     * @param {string} url - The URL to fetch the template from.
     * @returns {string} - The raw template string or empty string if fetch fails.
     */
    async fetch(url) {
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
    },


    cache: {
        /**
     * Cache management: Add a template to the cache
     * @param {string} path - The path for the template.
     * @param {string} template - The raw template string.
     */
        add(path, template) {
            Template.caches.set(path, template);  // Add to the cache map
        },

        /**
         * Cache management: Delete a template from the cache
         * @param {string} path - The path of the template to delete.
         */
        delete(path) {
            Template.caches.delete(path);  // Delete the template from the cache map
        },

        /**
         * Cache management: Refresh a template by re-fetching and updating the cache
         * @param {string} path - The path of the template to refresh.
         */
        async refresh(path) {
            const fullPath = `${this.prefix}${path}${this.extension}`;
            try {
                const newTemplate = await Template.fetch(fullPath);
                if (newTemplate) {
                    Template.cache.add(path, newTemplate);  // Update cache with new template
                }
            } catch (error) {
                console.error(`Error refreshing template at ${path}:`, error);
            }
        },

    },


    /**
     * Render a template for a given path and data
     * @param {string} path - The path to fetch the template for.
     * @param {Object} data - The data to inject into the template.
     * @param {string} targetElementId - The ID of the HTML element to inject the rendered template into.
     */
    render: async function (path, data) {
        // Check if the template is already cached, otherwise preload it
        if (!this.caches.has(path)) {
            await this.preload([path]);  // Preload template if not cached
        }

        const templateSource = this.caches.get(path);
        if (!templateSource) {
            console.error(`Template for path ${path} not found.`);
            return;
        }

        const parsedHtml = await this.parse(templateSource, data) ;
        if(this.container) this.container.innerHTML = await Translator.translate(parsedHtml);
    },

    /**
     * Parse the raw template string with Handlebars and inject data
     * @param {string} templateSource - The raw template string.
     * @param {Object} data - The data to inject into the template.
     * @returns {string} - The parsed HTML with injected data.
     */
    async parse(templateSource, data) {
        const template = this.Handlebars.compile(templateSource);  // Compile Handlebars template
        return template(data);  // Return the rendered HTML
    }

};

export default Template;
