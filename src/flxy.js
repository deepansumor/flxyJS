// Import all required modules
import * as Emitter from "./common/emitter.js";
import * as States from "./common/state.js";
import * as Router from "./common/router.js";
import * as Api from "./common/api.js";
import * as Template from "./common/template.js";
import * as Translator from "./common/translator.js";
import * as Device from "./common/device.js";
import * as Events from "./common/events.js";
import * as Location from "./common/location.js";

// Define the main Flxy object
const Flxy = {};


// Initialize core modules
(async function initializeCoreModules() {
    Router.init();
    await Device.init();
})();

// Create and prepend the main container to the DOM as soon as the body is available
const createContainer = () => {
    const container = document.createElement("div");
    container.id = "flxy";
    document.body.prepend(container);
    return container;
};

// Ensure body is available
const init = (callback) => {
    if (document.body) {
        callback();
    } else {
        const observer = new MutationObserver(() => {
            if (document.body) {
                observer.disconnect();
                callback();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }
};

// Create the container as soon as the body is available
init(() => {
    Flxy.container = createContainer();
    Template.setContainer(Flxy.container);
    Events.init(Flxy.container)
});

const modules = ({
    template: Template,
    translator: Translator,
    router: Router,
    api: Api,
    emitter: Emitter,
    device: Device,
    states: States,
    events:Events,
    location:Location
});

Object.keys(modules).forEach((module) => Flxy[module] = {...modules[module]});

export default Flxy;