import { error as LogError , warn as LogWarning, info as LogInfo} from "./logger.js";

const ModuleLoader = {
    modules: {}, // Store loaded modules
    loadingModules: new Set(), // Track loading modules
    functionName: 'default', // Default function to call
    baseURL: `${window.location.origin}/modules`, // Base URL baseURL for module paths
};

/**
 * Configure the ModuleLoader settings.
 * @param {object} options - Configuration options.
 * @param {string} [options.functionName] - The function name to call from the module.
 * @param {string} [options.baseURL] - The base URL baseURL for module paths.
 */
export function setConfig({ functionName, baseURL } = {}) {
    if (functionName) {
        ModuleLoader.functionName = functionName;
    }
    if (baseURL) {
        ModuleLoader.baseURL = baseURL;
    }
}

// Set the baseURL of domain
export function setBaseURL (baseURL){
    ModuleLoader.baseURL = baseURL;
}

/**
 * Dynamically import a module and call its configured function if available.
 * @param {string} path - The path to the module file.
 * @param {...any} args - Arguments to pass to the function.
 * @returns {Promise<any>} - Resolves with the function result or module itself.
 */
export async function loadModule(path, ...args) {
    const fullPath = ModuleLoader.baseURL + path + ".js";
    
    if (ModuleLoader.modules[fullPath]) {
        return callConfiguredFunction(ModuleLoader.modules[fullPath], ...args);
    }
    

    if (ModuleLoader.loadingModules.has(fullPath)) {
        LogWarning(`Module is already being loaded: ${fullPath}`);
        return null; // Prevent duplicate loading
    }
    
    ModuleLoader.loadingModules.add(fullPath);
    
    try {
        const module = await import(/* webpackIgnore: true */ fullPath);

        ModuleLoader.modules[fullPath] = module; // Cache module
        ModuleLoader.loadingModules.delete(fullPath);
        return callConfiguredFunction(module, ...args);
    } catch (error) {
        ModuleLoader.loadingModules.delete(fullPath);
        if (error.message.includes('failed to fetch') || error.message.includes('404')) {
            LogWarning(`Module not found: ${fullPath}`);
            return null; // Silently handle 404 errors
        }
        LogInfo(`Failed to load module: ${fullPath}`, error);
        throw error;
    }
}

/**
 * Calls the configured function of a module if it exists.
 * @param {object} module - The imported module.
 * @param {...any} args - Arguments to pass to the function.
 * @returns {any} - The result of the function or the module itself.
 */
function callConfiguredFunction(module, ...args) {
    const fn = ModuleLoader.functionName;
    if (module[fn] && typeof module[fn] === 'function') {
        return module[fn](...args);
    }
    return module; // Return module if function doesn't exist
}

export default ModuleLoader;