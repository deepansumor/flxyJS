const Emitter = {
    events: {},

    /**
     * Emit an event with optional data.
     * @param {string} event - The event name (e.g., 'event:sdk.loaded').
     * @param  {...any} args - The data to be passed to the listeners.
     */
    emit(event, ...args) {
        if (!this.events[event]) return; // No listeners, exit early

        // Trigger all the listeners for the given event with the provided data
        this.events[event].forEach(listener => listener(...args));
    },

    /**
     * Subscribe to an event.
     * @param {string} event - The event name (e.g., 'event:sdk.loaded').
     * @param {function} listener - The callback function to be triggered when the event is emitted.
     */
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = []; // Initialize array for listeners if it doesn't exist
        }
        this.events[event].push(listener);
    },

    /**
     * Unsubscribe from an event.
     * @param {string} event - The event name (e.g., 'event:sdk.loaded').
     * @param {function} listener - The callback function to remove from the event's listeners.
     */
    off(event, listener) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(l => l !== listener);
    },

    /**
     * Subscribe to an event, but only for the first emission.
     * @param {string} event - The event name (e.g., 'event:sdk.loaded').
     * @param {function} listener - The callback function to be triggered the first time the event is emitted.
     */
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper); // Remove the listener after it's triggered once
        };
        this.on(event, onceWrapper);
    },

    /**
     * Subscribe to one or more events.
     * @param {string|Array<string>} events - The event name(s) (e.g., 'event:sdk.loaded' or ['event1', 'event2']).
     * @param {function} callback - The callback function to be triggered when the events are emitted.
     */
    subscribe(events, callback) {
        // Ensure that events is always an array
        events = Array.isArray(events) ? events : [events];

        // Subscribe to each event in the array
        events.forEach(event => this.on(event, callback));
    },

    /**
     * Unsubscribe from one or more events.
     * @param {string|Array<string>} events - The event name(s) to stop listening to.
     * @param {function} callback - The callback function to remove from the listeners.
     */
    unsubscribe(events, callback) {
        // Ensure that events is always an array
        events = Array.isArray(events) ? events : [events];

        // Unsubscribe from each event in the array
        events.forEach(event => this.off(event, callback));
    }
};

export default Emitter;
