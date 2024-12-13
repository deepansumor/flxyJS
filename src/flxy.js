import Router from "./common/router.js";
import Template from "./common/template.js";
const Flxy = {};

const container = document.createElement("div");
container.id = "flxy";
document.body.prepend(container)

Flxy.container = container;
Template.container = container;

// Middleware that checks if the user is authenticated
async function authMiddleware(request) {
    const isAuthenticated = await new Promise(resolve => setTimeout(()=>resolve(true), 0));
    if (!isAuthenticated) {
        console.log("User is not authenticated, blocking route access.");
        return false; // Abort the route change
    }
    request.data = { yes: 1 }
    return true; // Proceed to route handler
}

// Register a route with a middleware
Router.register('/about', async (request) => {
    await Template.render("/about",request.query);
}, authMiddleware);

Router.register('/profile', async (request) => {
    await Template.render("/about",request.query);
}, authMiddleware);


Flxy.router = Router; // Replaces current path with /home
window.Flxy = Flxy;

window.addEventListener('DOMContentLoaded',() => Flxy.router.handle())
export default Flxy;