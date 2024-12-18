// Define the events object at the top within Emitter
const Emitter = {
    events: {}
};

/**
 * Emit an event with optional data.
 * @param {string} event - The event name (e.g., 'event:sdk.loaded').
 * @param  {...any} args - The data to be passed to the listeners.
 */
export function emit(event, ...args) {
    if (!Emitter.events[event]) return; // No listeners, exit early

    // Trigger all the listeners for the given event with the provided data
    Emitter.events[event].forEach(listener => listener(...args));
}

/**
 * Subscribe to an event.
 * @param {string} event - The event name (e.g., 'event:sdk.loaded').
 * @param {function} listener - The callback function to be triggered when the event is emitted.
 */
export function on(event, listener) {
    if (!Emitter.events[event]) Emitter.events[event] = []; // Initialize array for listeners if it doesn't exist
    Emitter.events[event].push(listener);
}

/**
 * Unsubscribe from an event.
 * @param {string} event - The event name (e.g., 'event:sdk.loaded').
 * @param {function} listener - The callback function to remove from the event's listeners.
 */
export function off(event, listener) {
    if (!Emitter.events[event]) return;

    Emitter.events[event] = Emitter.events[event].filter(l => l !== listener);
}

/**
 * Subscribe to an event, but only for the first emission.
 * @param {string} event - The event name (e.g., 'event:sdk.loaded').
 * @param {function} listener - The callback function to be triggered the first time the event is emitted.
 */
export function once(event, listener) {
    const onceWrapper = (...args) => {
        listener(...args);
        off(event, onceWrapper); // Remove the listener after it's triggered once
    };
    on(event, onceWrapper);
}

/**
 * Subscribe to one or more events.
 * @param {string|Array<string>} eventsList - The event name(s) (e.g., 'event:sdk.loaded' or ['event1', 'event2']).
 * @param {function} callback - The callback function to be triggered when the events are emitted.
 */
export function subscribe(eventsList, callback) {
    // Ensure that eventsList is always an array
    eventsList = Array.isArray(eventsList) ? eventsList : [eventsList];

    // Subscribe to each event in the array
    eventsList.forEach(event => on(event, callback));
}

/**
 * Unsubscribe from one or more events.
 * @param {string|Array<string>} eventsList - The event name(s) to stop listening to.
 * @param {function} callback - The callback function to remove from the listeners.
 */
export function unsubscribe(eventsList, callback) {
    // Ensure that eventsList is always an array
    eventsList = Array.isArray(eventsList) ? eventsList : [eventsList];

    // Unsubscribe from each event in the array
    eventsList.forEach(event => off(event, callback));
}
