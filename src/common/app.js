import * as Template from "./template.js";

/**
 * App - A simple event delegation and template handling system.
 * This module provides a way to set a container and manage events dynamically.
 */

const App = {
    container: null,
    /**
     * Sets the main container for the application.
     * This container will be used as the root element for event delegation and template rendering.
     * 
     * @param {HTMLElement|string} container - The container element or a selector string.
     */
    setContainer: function (container) {

        // If a string is provided, use `querySelector` to select the container element
        container = typeof container === "string" ? document.querySelector(container) : container;

        // Validate that the selected container is a valid HTML element
        if (!(container instanceof HTMLElement)) throw new Error("Invalid container specified");

        if (App.container) App.container.remove()
        // Store the container in the Flxy object for global reference
        App.container = container;

        // Pass the container to the Template system (if used in the app)
        Template.setContainer(container);

    }
};

export const setContainer = App.setContainer;

export const container = () => App.container;