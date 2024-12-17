import STATES from "../utils/states.js";


/**
 * ErrorHandler is responsible for handling and logging errors throughout the routing system.
 */
const ErrorHandler = {
  /**
   * Handles errors by logging the error code and message.
   * @param {number} errorCode - The HTTP status code for the error.
   * @param {string} message - A detailed description of the error.
   */
  handle(errorCode, message) {
    console.error(`Error ${errorCode}: ${message}`);
    // Add custom fallback behavior (e.g., redirect to a specific error page)
  },
};

/**
 * Router is a lightweight client-side routing system that manages navigation and route handling.
 */
const Router = {
  currentPath: null, // The current active route path.
  currentQuery: new URLSearchParams(window.location.search), // Stores the current query parameters.
  listeners: [], // Array to store route change listeners.
  history: [], // Stores the history of navigated routes.
  routes: {}, // Registered routes and their associated handlers.
  routeStates: {}, // The current state of each route (e.g., loading, success, error).
  middlewares: [], // Array of middlewares to execute before handling the route.

  /**
   * Initializes the router by setting the current route and listening for browser history changes.
   * @example Router.init();
   */
  init() {
    window.addEventListener("popstate", () => {
      this.currentQuery = new URLSearchParams(window.location.search);
      this.handle();
    });
  },

  /**
   * Registers a new route with a handler and optional middleware.
   * @param {string} routeName - The name of the route (e.g., '/home').
   * @param {function} handler - The function to execute when the route is matched.
   * @param {Array|function} [middlewares=[]] - Middleware functions to execute before the handler.
   * @example
   * Router.register('/home', (ctx) => console.log('Home'), [authMiddleware]);
   */
  register(routeName, handler, middlewares = []) {
    middlewares = typeof middlewares === "function" ? [middlewares] : middlewares;

    if (!Array.isArray(middlewares) || middlewares.some(mw => typeof mw !== "function")) {
      throw new Error(`Middleware should be a function or an array of functions for route ${routeName}`);
    }

    if (typeof handler !== "function") {
      throw new Error(`Handler should be a function for route ${routeName}`);
    }

    const paramRegex = /:[^/]+/g;
    const isDynamic = paramRegex.test(routeName);

    this.routes[routeName] = { handler, middlewares, isDynamic };
  },

  /**
   * Handles route changes, including executing middlewares and the route handler.
   * @example Router.handle();
   */
  async handle() {
    const query = this.getParsedQuery();
    const routeName = query.routeName;
    const route = this.routes[routeName] || this.routes["/404"];
    const { handler, middlewares } = route || {};
    this.currentPath = routeName;

    if (!handler) {
      this.error(404);
      return;
    }

    this.setState(routeName, STATES.LOADING);

    const context = {
      path: this.currentPath,
      query: this.getCurrentQuery(),
      params: query.params,  // Parameters extracted from the route.
      navigate: this.navigate.bind(this),
    };


    try {
      const middlewareResults = await this.executeMiddlewares(middlewares, context);

      if (!middlewareResults.every(result => result)) return this.error(400);

      await this.executeHandler(handler, context);
      this.setState(routeName, STATES.SUCCESS);
    } catch (error) {
      console.error("Error:", error);
      this.error(500);
    }

    this.notifyListeners(context);
  },

  /**
   * Handles errors during route handling and logs them.
   * @param {number} errorCode - The HTTP status code for the error.
   */
  error(errorCode) {
    ErrorHandler.handle(errorCode, `Route handling failed for ${this.currentPath}`);
  },

  /**
   * Executes all middlewares for a given route.
   * @param {Array} middlewares - The middlewares to execute.
   * @param {Object} context - The context object passed to each middleware.
   * @returns {Promise<boolean[]>} - An array of boolean values indicating middleware success.
   */
  async executeMiddlewares(middlewares, context) {
    const results = await Promise.all(
      middlewares.map(async middleware => {
        try {
          return await middleware(context);
        } catch (error) {
          console.error("Middleware error:", error);
          return false;
        }
      })
    );
    return results;
  },

  /**
   * Updates the state of a specific route.
   * @param {string} routeName - The route name.
   * @param {string} state - The current state of the route ('loading', 'success', 'error').
   * @example Router.setState('/home', 'success');
   */
  setState(routeName, state) {
    this.routeStates[routeName] = state;
    console.log(`Route ${routeName} is in state: ${state}`);
  },

  /**
   * Executes the handler function for a route.
   * @param {function} handler - The handler function to execute.
   * @param {Object} context - The context passed to the handler.
   * @example Router.executeHandler((ctx) => console.log(ctx), {});
   */
  async executeHandler(handler, context) {
    console.log("Loading...", context);
    await handler(context);
  },

  /**
   * Navigates to a new route and updates the browser's history.
   * @param {string} path - The route path to navigate to.
   * @param {Object} [query={}] - Optional query parameters to append to the URL.
   * @example Router.navigate('/about', { user: 'john' });
   */
  navigate(path, query = {}) {
    query.route = path;
    const queryString = new URLSearchParams(query).toString();
    const fullUrl = `${window.location.pathname}?${queryString}`;

    if (this.currentQuery.toString() !== queryString) {
      this.currentQuery = new URLSearchParams(query);
      window.history.pushState({}, "", fullUrl);
      this.history.push({ query });
      this.handle();
    }
  },

  /**
   * Subscribes a callback function to route change events.
   * @param {function} callback - The callback function to execute when the route changes.
   * @example Router.onChange((route) => console.log('Route changed:', route));
   */
  onChange(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
    }
  },

  /**
   * Notifies all subscribed listeners about the current route context.
   */
  notifyListeners(context) {
    this.listeners.forEach(callback => callback(context));
  },

  /**
   * Extracts the route name and parameters from the current query string.
   * @returns {Object} - The route name, original query, and dynamic parameters.
   */
  getParsedQuery() {
    const queryRoute = this.currentQuery.get("route");
    const staticRoute = this.routes[queryRoute];
    const dynamicRoute = !staticRoute ? this.matchDynamicRoute(queryRoute) : staticRoute;
    return {
      routeName: staticRoute ? queryRoute : dynamicRoute ? dynamicRoute.routeName : null,
      queryRoute,
      params: dynamicRoute?.params
    };
  },

  /**
   * Attempts to match a dynamic route using a regex pattern.
   * @param {string} routeName - The name of the route to match.
   * @returns {Object|null} - The matched route or null if no match is found.
   */
  matchDynamicRoute(routeName) {
    console.log(routeName)
    for (const [key, value] of Object.entries(this.routes)) {
      if (value.isDynamic && routeName) {
        const regex = new RegExp(`^${key.replace(/:[^/]+/g, "([^/]+)")}$`);
        const match = routeName.match(regex);

        if (match) {
          const params = {};
          const dynamicKeys = key.match(/:([^/]+)/g).map(segment => segment.substring(1));

          dynamicKeys.forEach((key, index) => {
            params[key] = match[index + 1];
          });

          return { ...value, params, routeName: key };
        }
      }
    }
    return null;
  },

  /**
   * Refreshes the current route with updated query parameters.
   * @param {Object} [newParams] - Optional query parameters to update the route with.
   * @example Router.refresh({ foo: 'bar' });
   */
  refresh(newParams = this.getCurrentQuery()) {
    if (newParams.route) {
      console.warn(`Please use navigate to move to a new route`);
    }
    newParams.route = this.currentPath;
    this.navigate(this.currentPath, newParams);
  },

  /**
   * Returns the current query parameters as an object.
   * @returns {Object} - The current query parameters.
   */
  getCurrentQuery() {
    return Object.fromEntries(this.currentQuery);
  },

  /**
   * Retrieves the entire navigation history.
   * @returns {Array} - A copy of the navigation history.
   */
  getHistory() {
    return [...this.history];
  },

  /**
   * Clears all route change listeners.
   */
  clearListeners() {
    this.listeners = [];
  },

};

// Initialize the Router on page load
Router.init();

export default Router;
