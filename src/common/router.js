const ErrorHandler = {
  /**
   * Handle different types of errors by logging the error code.
   * @example ErrorHandler.handle(404); // Logs "Error: 404"
   * @param {number} errorCode - The error code (e.g., 404, 400, 500).
   */
  handle: (errorCode) => console.log(`Error: ${errorCode}`)
};

const Router = {
  currentPath: null,  // Use the current path to identify the base page (e.g., '/home')
  currentQuery: new URLSearchParams(window.location.search),  // Parse the query parameters (e.g., '?route=home')
  listeners: [],  // Array to store listeners for route changes
  history: [],  // Track the history of queries
  routes: {},  // Store the registered routes (e.g., home, about, 404)
  routeStates: {},  // Track the state of each route (loading, success, error)
  middlewares: [],  // Store middleware functions

  /**
   * Initialize the router by pushing the current query to history
   * and setting up an event listener for the 'popstate' event.
   * @example Router.init(); // Initializes the router and listens for changes in the URL.
   */
  init() {
    this.currentPath = this.getRouteNameFromQuery();
    this.history.push({ query: this.getCurrentQuery() });
    window.addEventListener("popstate", () => {
      this.currentQuery = new URLSearchParams(window.location.search);
      this.handle();  // Re-handle the route whenever the browser history changes
    });
  },

  /**
   * Register a new route with its handler and associated middlewares.
   * @example
   * Router.register('home', (context) => { console.log("Home route", context); }, [middleware1, middleware2]);
   * Registers the 'home' route with the specified handler and middleware functions.
   * @param {string} routeName - The name of the route (from query parameter, e.g., 'home').
   * @param {function} handler - The handler function for the route (e.g., to render a page).
   * @param {Array} middlewares - Array of middleware functions to execute before the handler.
   */
  register(routeName, handler, middlewares = []) {
    middlewares = typeof middlewares == 'function' ? [middlewares] : middlewares;

    if (!Array.isArray(middlewares) || middlewares.some(middleware => typeof middleware != "function")) {
      throw new Error(`Middleware should be a function or an empty array for route ${routeName}`);
    }

    if (typeof handler != 'function') {
      throw new Error(`Handler should be a function for route ${routeName}`);
    }

    this.routes[routeName] = { handler, middlewares };
  },

  /**
   * Handle the query parameters and route logic.
   * @example
   * // If URL is /home?route=about, it will execute the handler for the 'about' route.
   * Router.handle();
   * Resolves middlewares before executing the route handler.
   */
  async handle() {
    const routeName = this.getRouteNameFromQuery();  // Extract route name from query (e.g., 'home' or 'about')
    const route = this.routes[routeName] || this.routes["/404"];  // Default to 404 if no match is found
    const { handler, middlewares } = route || {};
    this.currentPath = routeName;

    if (!handler) {
      ErrorHandler.handle(404);  // Route not found, handle with 404 error
      return;
    }

    // Set the state of the route to 'loading' as the route is being processed
    this.setState(routeName, 'loading');

    const context = {
      path: this.currentPath,
      query: this.getCurrentQuery(),
      navigate: this.navigate.bind(this),  // Pass navigate method to middleware
    };

    try {
      // Wait for middlewares to resolve and handle their results
      const middlewareResults = await this.executeMiddlewares(middlewares, context);

      // If any middleware fails (false or throws an error), handle the error
      if (!middlewareResults.every(result => result)) {
        ErrorHandler.handle(400); // Bad request if any middleware fails
        return;
      }

      // Proceed with the route handler if all middlewares passed
      await this.executeHandler(handler, context);
      this.setState(routeName, 'success');
    } catch (error) {
      // Handle middleware or route handler errors
      console.error("Error:", error);
      ErrorHandler.handle(500); // Internal server error if an error occurs during handling
    }

    this.notifyListeners();
  },

  /**
   * Execute all middlewares for the current route.
   * @example
   * // Example middleware that logs the context before allowing the handler to execute
   * const logMiddleware = (context) => { console.log("Context:", context); return true; };
   * await Router.executeMiddlewares([logMiddleware], context);
   * @param {Array} middlewares - The middlewares to be executed.
   * @param {Object} context - The current route context that middlewares can modify.
   * @returns {Promise<boolean[]>} - An array of boolean values indicating if each middleware passed.
   */
  async executeMiddlewares(middlewares, context) {
    const results = await Promise.all(
      middlewares.map(async (middleware) => {
        try {
          // Pass the context object to middleware for modification
          return await middleware(context);
        } catch (error) {
          console.error("Middleware error:", error);
          return false; // If any middleware throws, it fails the route handling
        }
      })
    );
    return results;
  },

  /**
   * Set the state of a route (loading, success, error) for tracking.
   * @example
   * Router.setState('home', 'loading'); // Marks the 'home' route as loading.
   * @param {string} routeName - The route name.
   * @param {string} state - The state of the route ('loading', 'success', 'error').
   */
  setState(routeName, state) {
    this.routeStates[routeName] = state;
    console.log(`Route ${routeName} is in state: ${state}`);
  },

  /**
   * Execute the route handler function.
   * @example
   * // Example handler that logs the context
   * const homeHandler = (context) => { console.log("Home Handler:", context); };
   * await Router.executeHandler(homeHandler, context);
   * @param {function} handler - The handler function for the route.
   * @param {Object} context - The route context passed to the handler.
   * @returns {Promise} - A promise that resolves when the handler finishes.
   */
  async executeHandler(handler, context) {
    console.log("Loading...");
    await handler(context);
  },

  /**
   * Navigate by updating the query parameters (without changing the path).
   * @example
   * // Navigate to the 'about' route with a query parameter
   * Router.navigate('about', { route: 'about' });
   * @param {string} path - The path to navigate to (e.g., 'home').
   * @param {object} query - The query parameters.
   */
  navigate(path, query = {}) {
    query.route = path;
    const queryString = new URLSearchParams(query).toString();
    const fullUrl = `${window.location.pathname}?${queryString}`;
    // Only navigate if the query string has changed
    if (this.currentQuery.toString() !== queryString) {
      this.currentQuery = new URLSearchParams(query);
      window.history.pushState({}, "", fullUrl);  // Update history with new query
      this.history.push({ query });
      this.handle();
    }
  },

  /**
   * Subscribe to changes in the route.
   * @example
   * // Subscribe to route changes and log them
   * Router.onChange((route) => { console.log("Route changed:", route); });
   * @param {function} callback - The callback function to call when the route changes.
   */
  onChange(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
    }
  },

  /**
   * Notify all subscribed listeners of a route change.
   * @example
   * // Notify all listeners of a route change
   * Router.notifyListeners();
   */
  notifyListeners() {
    const currentRoute = {
      path: this.currentPath,
      query: this.getCurrentQuery(),
      state: this.routeStates[this.getRouteNameFromQuery()] || 'unknown',
    };
    this.listeners.forEach((callback) => callback(currentRoute));
  },

  /**
   * Helper function to extract the route name from query parameters.
   * @example
   * // Extract 'home' from the query '?route=home'
   * Router.getRouteNameFromQuery(); // Returns 'home'
   * @returns {string} - The route name from the query params.
   */
  getRouteNameFromQuery() {
    return this.currentQuery.get('route') || this.currentPath;  // Default to 'current' if no route is specified
  },

  /**
   * Refresh the current route with the provided query parameters or with the current query.
   * If no parameters are provided, it will refresh with the current parameters only.
   * @example
   * // Refresh with the current query
   * Router.refresh();
   * // Refresh with new query parameters
   * Router.refresh({ route: 'about' });
   * @param {object} [newParams] - Optional new query parameters to update and refresh the route.
   */
  refresh(newParams = this.getCurrentQuery()) {
    newParams.route = this.currentPath;
    const queryString = new URLSearchParams(newParams).toString();
    const fullUrl = `${window.location.pathname}?${queryString}`;
    // Only navigate if the query string has changed
    if (this.currentQuery.toString() !== queryString) {
      this.currentQuery = new URLSearchParams(newParams);
      window.history.pushState({}, "", fullUrl);  // Update history with new query
      this.history.push({ query: newParams });
      this.handle();  // Re-run the route handling process with the updated parameters
    }
  },
  
  getCurrentQuery() {
    return Object.fromEntries(this.currentQuery);
  },

  getHistory() {
    return [...this.history];
  },

  clearListeners() {
    this.listeners = [];
  },

};

// Initialize the Router on page load
Router.init();

export default Router;