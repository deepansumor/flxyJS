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


// Defining the object and properties at the top
const Router = {
  currentPath: null, // The current active route path.
  currentQuery: new URLSearchParams(window.location.search), // Stores the current query parameters.
  listeners: [], // Array to store route change listeners.
  history: [], // Stores the history of navigated routes.
  routes: {}, // Registered routes and their associated handlers.
  routeStates: {}, // The current state of each route (e.g., loading, success, error).
  middlewares: [], // Array of middlewares to execute before handling the route.
};

/**
 * Initializes the router by setting the current route and listening for browser history changes.
 * @example Router.init();
 */
export const init = () => {
  preventDefault();
  window.addEventListener("popstate", () => {
    Router.currentQuery = new URLSearchParams(window.location.search);
    handle();
  });
};

/**
 * Registers a new route with a handler and optional middleware.
 * @param {string} routeName - The name of the route (e.g., '/home').
 * @param {function} handler - The function to execute when the route is matched.
 * @param {Array|function} [middlewares=[]] - Middleware functions to execute before the handler.
 * @example
 * Router.register('/home', (ctx) => console.log('Home'), [authMiddleware]);
 */
export const register = (routeName, handler, middlewares = []) => {
  middlewares = typeof middlewares === "function" ? [middlewares] : middlewares;

  if (!Array.isArray(middlewares) || middlewares.some(mw => typeof mw !== "function")) {
    throw new Error(`Middleware should be a function or an array of functions for route ${routeName}`);
  }

  if (typeof handler !== "function") {
    throw new Error(`Handler should be a function for route ${routeName}`);
  }

  const paramRegex = /:[^/]+/g;
  const isDynamic = paramRegex.test(routeName);

  Router.routes[routeName] = { handler, middlewares, isDynamic };
};

/**
 * Handles route changes, including executing middlewares and the route handler.
 * @example Router.handle();
 */
export const handle = async (callback = () => {}) => {
  const query = getParsedQuery();
  callback= typeof callback != "function" ? () => {} : callback;
  if (!query.routeName) {
    Router.navigating = false;
    callback({status:404})
    console.log("No route");
    return;
  }

  const routeName = query.routeName;
  const route = Router.routes[routeName] || Router.routes["/404"];
  const { handler, middlewares } = route || {};
  Router.currentPath = routeName;

  if (!handler) {
    callback({status:404})
    error(404);
    return;
  }

  setState(routeName, STATES.LOADING);

  const context = {
    path: Router.currentPath,
    query: getCurrentQuery(),
    params: query.params,  // Parameters extracted from the route.
  };

  try {
    const middlewareResults = await executeMiddlewares(middlewares, context);

    if (!middlewareResults.every(result => result)) return error(400);

    await executeHandler(handler, context);
    setState(routeName, STATES.SUCCESS);
  } catch (error) {
    console.error("Error:", error);
    error(500);
  }

  notifyListeners(context);
  Router.navigating = false;
  callback({status:200})
};

/**
 * Handles errors during route handling and logs them.
 * @param {number} errorCode - The HTTP status code for the error.
 */
export const error = (errorCode) => {
  ErrorHandler.handle(errorCode, `Route handling failed for ${Router.currentPath}`);
  Router.navigating = false;
};

/**
 * Executes all middlewares for a given route.
 * @param {Array} middlewares - The middlewares to execute.
 * @param {Object} context - The context object passed to each middleware.
 * @returns {Promise<boolean[]>} - An array of boolean values indicating middleware success.
 */
export const executeMiddlewares = async (middlewares, context) => {
  const results = await Promise.all(
    middlewares.map(async middleware => {
      try {
        return await middleware(context);
      } catch (error) {
        console.error(String(middleware.name), error);
        return false;
      }
    })
  );
  return results;
};

/**
 * Updates the state of a specific route.
 * @param {string} routeName - The route name.
 * @param {string} state - The current state of the route ('loading', 'success', 'error').
 * @example Router.setState('/home', 'success');
 */
export const setState = (routeName, state) => {
  Router.routeStates[routeName] = state;
  console.log(`Route ${routeName} is in state: ${state}`);
};

/**
 * Executes the handler function for a route.
 * @param {function} handler - The handler function to execute.
 * @param {Object} context - The context passed to the handler.
 * @example Router.executeHandler((ctx) => console.log(ctx), {});
 */
export const executeHandler = async (handler, context) => {
  console.log("Loading...", context);
  await handler(context);
};

/**
 * Navigates to a new route and updates the browser's history.
 * @param {string} path - The route path to navigate to.
 * @param {Object} [query={}] - Optional query parameters to append to the URL.
 * @example Router.navigate('/about', { user: 'john' });
 */
export const navigate = (path, query = {}, _blank = false) => {
  if (Router.navigating) {
    return console.log(`Busy`);
  }

  // Parse the input path to extract the base path and query parameters
  const url = new URL(path, window.location.origin); // Resolve relative paths to full URL
  const basePath = url.pathname; // Extract path without query parameters
  const pathQuery = Object.fromEntries(url.searchParams.entries()); // Convert query params in the path to an object

  // Merge the extracted query parameters from the path with the provided query object
  const mergedQuery = { ...pathQuery, ...query };

  console.log('mergedQuery', mergedQuery, path, basePath)
  // Add the route property to the query
  mergedQuery.route = basePath;

  // Convert the merged query object to a query string
  const queryString = new URLSearchParams(mergedQuery).toString();
  const fullUrl = `${window.location.pathname}?${queryString}`;
  if (_blank) return window.open(fullUrl, '_blank');

  // Navigate only if the query has changed
  if (Router.currentQuery.toString() !== queryString) {
    Router.navigating = true;
    Router.currentQuery = new URLSearchParams(mergedQuery);
    window.history.pushState({}, "", fullUrl);
    Router.history.push({ query: mergedQuery });
    handle(); // Trigger the router handler
  }
};


/**
 * Subscribes a callback function to route change events.
 * @param {function} callback - The callback function to execute when the route changes.
 * @example Router.onChange((route) => console.log('Route changed:', route));
 */
export const onChange = (callback) => {
  if (typeof callback === "function") {
    Router.listeners.push(callback);
  }
};

/**
 * Notifies all subscribed listeners about the current route context.
 */
export const notifyListeners = (context) => {
  Router.listeners.forEach(callback => callback(context));
};

/**
 * Extracts the route name and parameters from the current query string.
 * @returns {Object} - The route name, original query, and dynamic parameters.
 */
export const getParsedQuery = () => {
  const queryRoute = Router.currentQuery.get("route");
  const staticRoute = Router.routes[queryRoute];
  const dynamicRoute = !staticRoute ? matchDynamicRoute(queryRoute) : staticRoute;
  return {
    routeName: staticRoute ? queryRoute : dynamicRoute ? dynamicRoute.routeName : null,
    queryRoute,
    params: dynamicRoute?.params || {}
  };
};

/**
 * Attempts to match a dynamic route using a regex pattern.
 * @param {string} routeName - The name of the route to match.
 * @returns {Object|null} - The matched route or null if no match is found.
 */
export const matchDynamicRoute = (routeName) => {
  for (const [key, value] of Object.entries(Router.routes)) {
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
};

/**
 * Refreshes the current route with updated query parameters.
 * @param {Object} [newParams] - Optional query parameters to update the route with.
 * @example Router.refresh({ foo: 'bar' });
 */
export const refresh = (newParams = getCurrentQuery()) => {
  if (newParams.route) {
    console.warn(`Please use navigate to move to a new route`);
  }
  newParams.route = Router.currentPath;
  navigate(Router.currentPath, newParams);
};

/**
 * Returns the current query parameters as an object.
 * @returns {Object} - The current query parameters.
 */
export const getCurrentQuery = () => {
  return Object.fromEntries(Router.currentQuery);
};

/**
 * Retrieves the entire navigation history.
 * @returns {Array} - A copy of the navigation history.
 */
export const getHistory = () => {
  return [...Router.history];
};

/**
 * Clears all route change listeners.
 */
export const clearListeners = () => {
  Router.listeners = [];
};


/**
* Redirects <a> tag navigation to the Router.navigate method and prevents page refresh,
* unless the link is opened in a new tab or a special key is pressed.
*/
const preventDefault = () => {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("a"); // Ensure target is an <a> tag
    if (!target || !target.hasAttribute("href")) return;

    const anchorHref = target.getAttribute("href");

    // Prevent external links or anchors without valid paths
    if (!anchorHref.startsWith("/")) return;
    // Allow default behavior for button
    if (event.button === 1) return;

    let _blank = event.ctrlKey || event.metaKey || event.shiftKey;

    event.preventDefault();

    // Debounce navigation to prevent duplicate calls
    if (target._navigating) return;
    target._navigating = true;

    setTimeout(() => (target._navigating = false), 100); // Reset after 100ms

    // Use custom navigation logic
    navigate(anchorHref, {}, _blank);
  });
};
