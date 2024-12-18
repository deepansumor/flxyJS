
import {local as storage} from './storage.js';  // Import Storage.js for persistence

// Constant key for storing the state in localStorage
const LOCAL_STORAGE_KEY = 'appState';

// Define the stateManager object at the top
const stateManager = {
    state: {},  // Holds the current state of the application
    subscribers: {},  // Holds the subscribers for each key
    actions: {},  // Holds registered actions
    action:{}
};

/**
 * Initializes the state manager with an initial state.
 * It also loads the state from localStorage if available or uses the provided initial state.
 * @param {Object} initialState - The initial state to be set if localStorage has no saved state.
 */
export function init(initialState = {}) {
    // Retrieve saved state from localStorage, merging with initialState if necessary
    const savedState = { ...(storage.get(LOCAL_STORAGE_KEY) || {}), ...initialState };
    Object.keys(savedState).forEach(key => set(key, savedState[key], false));  // Set each state key
}

/**
 * Retrieves the current state or the state of a specific key.
 * @param {string} key - The key whose state to retrieve (optional).
 * @returns {any} - The value of the state or specific key's value.
 */
export function get(key) {
    return stateManager.state[key];  // Return the state value for the given key
}

/**
 * Sets a new value for a specific key in the state.
 * It also generates a getter for the updated key and notifies any subscribers.
 * @param {string} key - The key to update.
 * @param {any} value - The new value to set.
 */
export function set(key, value, notify = true) {
    stateManager.state[key] = value;  // Update the state with the new value
    // Notify all subscribers of the updated state for the key
    if (notify) stateManager.notify(key);
}

/**
 * Saves the current state to localStorage using Storage.js.
 */
export function persist() {
    storage.set(LOCAL_STORAGE_KEY, stateManager.state);  // Persist the current state in localStorage
}

/**
 * Clears the persisted state in localStorage and resets the state in the state manager.
 */
export function clear() {
    storage.delete(LOCAL_STORAGE_KEY);  // Remove persisted state from localStorage
    stateManager.state = {};  // Reset the internal state object
    stateManager.subscribers = {};  // Clear any existing subscribers
    console.log('State has been cleared and localStorage removed.');
}

/**
 * Subscribes to changes in specific state keys.
 * The callback is triggered whenever the state for the subscribed keys changes.
 * @param {string|string[]} keys - The key or keys to subscribe to.
 * @param {function} callback - The callback to call when the state changes.
 */
export function subscribe(keys, callback) {
    keys = Array.isArray(keys) ? keys : [keys];  // Ensure keys is always an array

    // Register the subscriber for each key
    keys.forEach((key) => {
        if (!stateManager.subscribers[key]) stateManager.subscribers[key] = [];  // Initialize an array for subscribers if not already present
        stateManager.subscribers[key].push(callback);  // Add the callback to the subscriber list for the key
    });
}

/**
 * Notifies all subscribers of a key when the state for that key changes.
 * @param {string} key - The key whose subscribers should be notified.
 */
export function notify(key) {
    if (!stateManager.subscribers[key]) return;  // If there are no subscribers, exit early
    // Trigger the callback for each subscriber
    stateManager.subscribers[key].forEach((callback) => callback(key, stateManager.state[key]));
}

/**
 * Dispatches an action to modify the state.
 * Actions can update state, trigger async operations, or perform other side effects.
 * @param {string} action - The action type.
 * @param {Object} payload - The data associated with the action.
 */
export function dispatch(action, payload) {
    if (stateManager.actions[action]) {
        stateManager.actions[action](payload);  // Execute the action if it exists
    } else {
        console.error(`Action ${action} not found`);  // Log an error if the action does not exist
    }
}

/**
 * Registers a new action dynamically.
 * This method allows you to add custom actions to the stateManager after initialization.
 * @param {string} actionName - The name of the action.
 * @param {function} actionFunction - The function that implements the action.
 */
stateManager.action.register =  function (actionName, actionFunction) {
    if (typeof actionFunction !== 'function') {
        console.error('The action function must be of type function.');
        return;
    }

    if (typeof actionName !== 'string') {
        console.error('The action name must be of type string.');
        return;
    }

    stateManager.actions[actionName] = actionFunction;  // Register the new action
}

export const action = stateManager.action;


// Define default actions
stateManager.actions.fetch = async function({ key, url }) {
    try {
        const response = await fetch(url);  // Fetch data from the URL
        const data = await response.json();  // Parse the response as JSON
        set(key, data);  // Update the state with the fetched data
    } catch (error) {
        console.error('Error fetching data:', error);  // Log an error if fetching fails
    }
};

stateManager.actions.update = function(key, value) {
    set(key, value);  // Set the new value for the specified key
};

export const actions = stateManager.actions;