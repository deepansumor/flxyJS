const eventRegistry = new WeakMap();
const Event = {};

/**
 * Initializes the event delegation system with a container.
 * 
 * @param {HTMLElement|string} container - The container element or selector.
 */
export function init(container) {
    Event.container = typeof container === "string" ? document.querySelector(container) : container;

    if (!(Event.container instanceof HTMLElement)) {
        throw new Error("Invalid container specified for event delegation.");
    }
}

/**
 * Registers a single event listener for a selector and event type.
 * 
 * @param {string} selector - The CSS selector for the element(s).
 * @param {string} eventType - The event type to listen for (e.g., 'click').
 * @param {Function} callback - The callback function to execute when the event occurs.
 */
export function addListener(selector, eventType, callback) {
    if (!Event.container) {
        throw new Error("Event system is not initialized. Call `init(container)` first.");
    }

    // Attach the event listener with delegation
    const delegatedCallback = (event) => {
        const target = event.target.closest(selector);
        if (target && Event.container.contains(target)) {
            callback(event, target);
        }
    };

    // Register the event listener with the container
    Event.container.addEventListener(eventType, delegatedCallback);

    // Store the event in the registry for potential future removal
    if (!eventRegistry.has(Event.container)) {
        eventRegistry.set(Event.container, {});
    }

    const registeredEvents = eventRegistry.get(Event.container);
    if (!registeredEvents[eventType]) {
        registeredEvents[eventType] = [];
    }

    // Prevent multiple registrations of the same event handler for the same element
    if (!registeredEvents[eventType].includes(delegatedCallback)) {
        registeredEvents[eventType].push(delegatedCallback);
    }
}

/**
 * Removes a specific callback or all callbacks for an event type on the container.
 * 
 * @param {string} eventType - The event type to remove.
 * @param {Function} [callback] - The specific callback to remove (optional).
 */
export function removeListener(eventType, callback) {
    if (!Event.container) {
        throw new Error("Event system is not initialized. Call `init(container)` first.");
    }

    const registeredEvents = eventRegistry.get(Event.container);
    if (registeredEvents && registeredEvents[eventType]) {
        // If a specific callback is provided, remove only that callback
        if (callback) {
            const index = registeredEvents[eventType].indexOf(callback);
            if (index !== -1) {
                Event.container.removeEventListener(eventType, callback);
                registeredEvents[eventType].splice(index, 1);
            }
        } else {
            // If no callback is provided, remove all callbacks for the event type
            registeredEvents[eventType].forEach((cb) => {
                Event.container.removeEventListener(eventType, cb);
            });
            delete registeredEvents[eventType];
        }

        // Clean up the registry if no events remain
        if (Object.keys(registeredEvents).length === 0) {
            eventRegistry.delete(Event.container);
        }
    }
}
