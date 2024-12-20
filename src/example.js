import * as Emitter from "./common/emitter.js";
import * as States from "./common/state.js";
import * as Router from "./common/router.js";
import * as Api from "./common/api.js"
import * as Template from "./common/template.js";
import * as Translator from "./common/translator.js";
import * as Device from "./common/device.js"


const Flxy = {};

((() => {
    States.init({});
    Router.init();
    Translator.init();
})());

// Create and prepend the container
const container = document.createElement("div");
container.id = "flxy";
document.body.prepend(container);

Flxy.container = container;
Template.setContainer(container);


Api.configure({
    baseEndpoint: 'https://jsonplaceholder.typicode.com',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'X-Custom-Header': 'SomeValue',
    },
    middlewares: [function (options) {
        options.headers.new = 1;
    }]
});


// Middleware that checks if the user is authenticated
async function authMiddleware(request) {
    const isAuthenticated = await new Promise(resolve => setTimeout(() => resolve(true), 0));
    if (!isAuthenticated) {
        console.log("User is not authenticated, blocking route access.");
        return false; // Abort the route change
    }
    request.data = { yes: 1 };
    request.user = await Api.get(`/users/${request.params.id}`);
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
        request.user.next = +request.user.id + 1;
        request.user.prev = +request.user.id - 1;
        request.photos = [];
        await Template.render("/about", request);
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
Flxy.api = Api;
Flxy.emitter = Emitter;
Flxy.device = Device.hashString();
Flxy.states = States;

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


// Subscribe to specific key
States.subscribe('user', (key, data) => {
    console.log('User state updated:', key, data);
});

// Subscribe to multiple keys
States.subscribe(['user', 'theme'], (key, data) => {
    console.log('State updated:', key, data);
});

// Example usage
States.init({ user: null });
console.log(States.get("theme"));

States.persist();

export default Flxy;
