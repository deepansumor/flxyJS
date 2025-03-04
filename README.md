# Flxy.js - Lightweight Modular JavaScript Framework

## Overview
Flxy.js is a lightweight, modular JavaScript framework designed for seamless client-side development. It provides **state management, event handling, routing, API utilities, templating, internationalization, device detection, and performance tracking** in a unified and scalable manner.

## Features
✅ **Modular Architecture** - Includes independent modules for state management, routing, API handling, etc.  
✅ **Event Delegation** - Efficient event binding for dynamic elements.  
✅ **State Management** - Persistent and reactive state updates.  
✅ **Routing System** - Dynamic client-side routing with middleware.  
✅ **API Middleware** - Flexible API request handling with custom middlewares.  
✅ **Templating** - Mustache-based templating with caching support.  
✅ **Internationalization** - Multi-language support with dynamic translations.  
✅ **Performance Monitoring** - Execution time tracking for app performance.  
✅ **Geolocation & Device Detection** - Detects user location and device details.

---
## Installation
Flxy.js can be integrated into any JavaScript project.

### **Manual Installation**
Simply clone or download the repository and include the `flxy.js` file in your project.
```javascript
import Flxy from "./flxy.js";
```

---
## Getting Started
### **1. Initialize Flxy.js**
Flxy.js automatically initializes core modules (Router, Device detection, etc.), but you can manually configure them if needed.
```javascript
Flxy.app.setContainer("#app");
Flxy.events.init("#root");
```

### **2. Configure Routing**
Define routes dynamically and link them to template rendering.
```javascript
const FlxyRouter = Flxy.router;
const FlxyTemplate = Flxy.template;

const updateActiveNavLink = ({ path }) => {
    document.querySelectorAll("footer a").forEach(link => link.classList.remove("footer__nav-link--active"));
    document.querySelector(`footer a[href="${path}"]`)?.classList.add("footer__nav-link--active");
    return true;
};
FlxyRouter.use(updateActiveNavLink);

const routeMappings = {
    "/dashboard": "/dashboard",
    "/workout": "/workout",
    "/tasks": "/tasks"
};

Object.entries(routeMappings).forEach(([route, template]) => {
    FlxyRouter.register(route, async () => {
        await FlxyTemplate.render(template);
    });
});
```

### **3. API Requests with Middleware Support**
Flxy.js supports named middleware execution for API requests.
```javascript
Flxy.api.configure({ baseEndpoint: "https://api.example.com" });

Flxy.api.addMiddleware("auth", async (options) => {
    options.headers["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
});

Flxy.api.get("/users", {}, "auth").then(console.log);
```

### **4. State Management**
Store and retrieve application state efficiently.
```javascript
Flxy.states.set("theme", "dark");
console.log(Flxy.states.get("theme")); // Output: 'dark'
```

### **5. Event Handling**
Add event listeners using delegated event binding.
```javascript
Flxy.events.addListener(".button", "click", function () {
    console.log("Button clicked");
});
```

### **6. Dynamic Templating**
Render dynamic templates with preloaded data.
```javascript
Flxy.template.setPrefix("/templates");
Flxy.template.render("/dashboard", { username: "Alex" });
```

### **7. Translation & Internationalization**
Manage multi-language support dynamically.
```javascript
Flxy.translator.setPrefix("/translations");
Flxy.translator.load("en").then(() => {
    console.log(Flxy.translator.getByKey("greeting")); // Output: 'Hello'
});
```

---
## Advanced Features
### **Middleware for Performance Logging**
Flxy.js allows tracking performance using middleware-based logging.
```javascript
const tracker = Flxy.performance.start("API Call");

Flxy.api.get("/users").then(() => {
    tracker.end();
});
```

### **Geolocation API Integration**
Fetch user location using GPS or IP-based fallback.
```javascript
Flxy.location.get().then(console.log);
```

### **Modal Management via Event Listeners**
```javascript
Flxy.events.addListener("[data-modal]", "click", async function () {
    let { modal } = { ...this.dataset };
    if (!modal) return;
    
    let html = await Flxy.template.getHTML(modal, {});
    document.getElementById("root").innerHTML += html;
});
```

### **Form Handling & Dynamic UI Updates**
```javascript
Flxy.events.addListener(".task-form__frequency-type", "click", function () {
    let { type } = { ...this.dataset };
    document.querySelector(".task-form__weekly-container")
        .classList[type == "weekly" ? "remove" : "add"]
        ("task-form__weekly-container--hidden");

    document.querySelectorAll(".task-form__frequency-type").forEach(el => el.classList.remove("task-form__frequency-type--active"));
    this.classList.add("task-form__frequency-type--active")
});
```

### **Tag Management in Editable Fields**
```javascript
Flxy.events.addListener(".task-list__tags [contenteditable]", "keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        addTag(this);
    }
});

function addTag(elem) {
    let value = elem.innerHTML.trim();
    if (!value) return;

    let container = elem.closest(".task-list__tags");
    if (!container) return;

    const colors = ["yellow", "blue", "purple", "green"];
    let randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    let newTag = document.createElement("span");
    newTag.className = `tag tag--${randomColor}`;
    newTag.textContent = `#${value}`;
    
    container.insertBefore(newTag, container.lastElementChild);
    elem.innerHTML = "";
}
```

---
## Conclusion
Flxy.js is a powerful yet lightweight framework designed to make JavaScript development efficient and scalable. It offers **modular components, efficient state management, templating, API handling, routing, and internationalization** in a single package.

### 🚀 **Need Help?**
For contributions, bug reports, or feature requests, open an issue on GitHub.

---
### **Future Enhancements**
✅ WebSockets support for real-time updates  
✅ Advanced caching mechanism  
✅ Plugin system for third-party extensions  

---
**Developed with ❤️ for modern web applications.**

