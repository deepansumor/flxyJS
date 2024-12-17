


/**
 * The API module for handling HTTP requests with support for one-time configuration, async middlewares, and named middlewares.
 */
const API = {
    baseEndpoint: '',  // Default base endpoint for the API
    defaultMiddlewares: [],   // Default list of middleware functions that always execute
    namedMiddlewares: {},     // Store named middlewares
    defaultHeaders: {},       // Default headers for every request

    /**
     * Configures the API module with a base endpoint, optional default middlewares, and default headers.
     * @param {Object} config - Configuration object.
     * @param {string} config.baseEndpoint - The base URL for the API.
     * @param {Array|function} [config.middlewares=[]] - Default middlewares to apply before the request.
     * @param {Object} [config.headers={}] - Default headers to be included with each request.
     * @throws {Error} - Throws an error if any middleware is not a valid function.
     */
    configure({ baseEndpoint, middlewares = [], headers = {} }) {
        this.baseEndpoint = baseEndpoint;

        // Validate that all middlewares are functions
        if (Array.isArray(middlewares)) {
            middlewares.forEach(middleware => {
                if (typeof middleware !== 'function') {
                    throw new Error('Each middleware in defaultMiddlewares must be a function.');
                }
            });
        } else if (typeof middlewares === 'function') {
            middlewares = [middlewares];  // Allow single middleware function
        } else {
            throw new Error('Invalid middlewares. It should be a function or an array of functions.');
        }

        this.defaultMiddlewares = middlewares;

        // Set default headers
        if (typeof headers === 'object') {
            this.defaultHeaders = { ...headers };  // Merge with any existing headers
        } else {
            throw new Error('Invalid headers format. It should be an object.');
        }
    },

    /**
     * Adds a named middleware that can be executed later by its name.
     * @param {string} name - The name of the middleware (used to reference it later).
     * @param {function} middleware - The middleware function to execute.
     * @example
     * API.addMiddleware('auth', async (options) => { ... });
     */
    addMiddleware(name, middleware) {
        if (typeof name !== 'string' || typeof middleware !== 'function') {
            throw new Error('Middleware name must be a string and middleware must be a function.');
        }

        this.namedMiddlewares[name] = middleware;
    },

    /**
     * Executes the middlewares and modifies request options or blocks the request.
     * @param {Object} options - The request options (headers, body, etc.).
     * @param {Array|string} middlewareNames - The middleware(s) to execute. Can be a string (single name) or an array of names.
     * @returns {Promise<boolean[]>} - Array of boolean results indicating whether the request should proceed.
     */
    async executeMiddlewares(options, middlewareNames) {
        const middlewares = [
            ...this.defaultMiddlewares,  // Always run default middlewares
            ...this.getNamedMiddlewares(middlewareNames), // Get the named middlewares for this request
        ];

        const results = await Promise.all(
            middlewares.map(async middleware => {
                try {
                    // Execute the middleware with the current request options
                    const result = await middleware(options);
                    return result !== false; // If middleware returns false, stop the request
                } catch (error) {
                    console.error('Middleware error:', error);
                    return false; // If middleware fails, stop the request
                }
            })
        );

        return results;
    },

    /**
     * Gets the list of middlewares for a given set of names.
     * @param {Array|string} middlewareNames - The middleware(s) to get. Can be a string (single name) or an array of names.
     * @returns {Array} - Array of middleware functions.
     */
    getNamedMiddlewares(middlewareNames) {
        if (typeof middlewareNames === 'string') {
            return this.namedMiddlewares[middlewareNames] ? [this.namedMiddlewares[middlewareNames]] : [];
        }
        if (Array.isArray(middlewareNames)) {
            return middlewareNames
                .map(name => this.namedMiddlewares[name])
                .filter(Boolean);  // Filter out undefined middlewares
        }
        return [];
    },

    /**
     * Sends a GET request to the provided URL.
     * @param {string} url - The endpoint URL.
     * @param {Object} [options={}] - Optional request options (headers, query params, etc.).
     * @param {Array|string} [middlewareNames] - Middleware(s) to execute.
     * @returns {Promise<Object>} - The parsed JSON response.
     */
    async get(url, options = {}, middlewareNames = []) {
        return this.request(url, { method: 'GET', ...options }, middlewareNames);
    },

    /**
     * Sends a POST request to the provided URL.
     * @param {string} url - The endpoint URL.
     * @param {Object} data - The data to send with the request.
     * @param {Object} [options={}] - Optional request options (headers, etc.).
     * @param {Array|string} [middlewareNames] - Middleware(s) to execute.
     * @returns {Promise<Object>} - The parsed JSON response.
     */
    async post(url, data, options = {}, middlewareNames = []) {
        return this.request(url, { method: 'POST', body: JSON.stringify(data), ...options }, middlewareNames);
    },

    /**
     * Sends a PUT request to the provided URL.
     * @param {string} url - The endpoint URL.
     * @param {Object} data - The data to send with the request.
     * @param {Object} [options={}] - Optional request options (headers, etc.).
     * @param {Array|string} [middlewareNames] - Middleware(s) to execute.
     * @returns {Promise<Object>} - The parsed JSON response.
     */
    async put(url, data, options = {}, middlewareNames = []) {
        return this.request(url, { method: 'PUT', body: JSON.stringify(data), ...options }, middlewareNames);
    },

    /**
     * Sends a DELETE request to the provided URL.
     * @param {string} url - The endpoint URL.
     * @param {Object} [options={}] - Optional request options (headers, etc.).
     * @param {Array|string} [middlewareNames] - Middleware(s) to execute.
     * @returns {Promise<Object>} - The parsed JSON response.
     */
    async delete(url, options = {}, middlewareNames = []) {
        return this.request(url, { method: 'DELETE', ...options }, middlewareNames);
    },

    /**
     * Handles the actual HTTP request after applying middlewares.
     * @param {string} url - The endpoint URL.
     * @param {Object} options - The request options (method, headers, etc.).
     * @param {Array|string} middlewareNames - Middleware(s) to execute.
     * @returns {Promise<Object>} - The parsed JSON response.
     * @throws {Error} - Throws an error if the response is not successful.
     */
    async request(url, options = {}, middlewareNames = []) {
        options.headers = options.headers || {};
        // Apply middlewares to modify headers, data, or block the request
        const middlewareResults = await this.executeMiddlewares(options, middlewareNames);

        // If any middleware fails, prevent the request from being made
        if (!middlewareResults.every(result => result)) {
            throw new Error('Middleware failed, API request blocked');
        }

        // Add the base endpoint if configured
        const finalUrl = `${this.baseEndpoint}${url}`;

        // Default headers for every request, with the option to override in individual calls
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.defaultHeaders,  // Merge default headers
            ...options.headers,      // Override with custom headers for this request
        };

        const payload = { ...options, headers };

        try {
            const response = await fetch(finalUrl, payload);

            // Check for HTTP success
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();  // Parse JSON response
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        } 

    },
};

export default API;
