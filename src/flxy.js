import Emitter from "./common/emitter.js";
import Router from "./common/router.js";
import API from "./common/api.js"
import Template from "./common/template.js";
import Translator from "./common/translator.js";
const Flxy = {};

// Create and prepend the container
const container = document.createElement("div");
container.id = "flxy";
document.body.prepend(container);

Flxy.container = container;
Template.container = container;


// Middleware that checks if the user is authenticated
async function authMiddleware(request) {
    const isAuthenticated = await new Promise(resolve => setTimeout(() => resolve(true), 0));
    if (!isAuthenticated) {
        console.log("User is not authenticated, blocking route access.");
        return false; // Abort the route change
    }
    request.data = { yes: 1 };
    return true; // Proceed to route handler
}

// Register routes with middlewares
Router.register('/about', async (request) => {
    try {
        await Template.render("/about", request.query);
    } catch (error) {
        console.error('Error rendering /about template', error);
    }
}, authMiddleware);


Router.register('/about/:id', async (request) => {
    try {
        console.log(request);
        await Template.render("/about", request.query);
    } catch (error) {
        console.error('Error rendering /about template', error);
    }
}, authMiddleware);


Router.register('/profile', async (request) => {
    try {
        await Template.render("/profile", request.query);
    } catch (error) {
        console.error('Error rendering /profile template', error);
    }
}, authMiddleware);

// Attach Flxy to global window object
Flxy.template = Template;
Flxy.translator = Translator;
Flxy.router = Router; // Replaces current path with /

window.Flxy = Flxy;

// Create a listener
const listener1 = (data) => {
    console.log(`Subscriber 1 received event with data`, data);
};

// Subscribe to a single event
Emitter.subscribe('event:sdk.loaded', listener1);

Emitter.emit('event:sdk.loaded', {
    timestamp: Date.now()
})
// Start handling the current route
Flxy.router.handle();

API.configure({
    baseEndpoint: 'https://jsonplaceholder.typicode.com',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'X-Custom-Header': 'SomeValue',
    },
    middlewares: [function (options) {
        options.headers.new = 1;
    }]
});

async function fetchUserData(userId) {
    try {
        const data = await API.get(`/todos/1`);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

fetchUserData()


export default Flxy;
