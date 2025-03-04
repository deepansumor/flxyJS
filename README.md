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

### **CDN Installation**
You can use Flxy.js directly via CDN:
```html
<script src="http://cdn.jsdelivr.net/gh/deepansumor/FlxyJS@latest/dist/main.bundle.js"></script>
```

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

### **2. Device Detection**
Flxy.js provides built-in methods to retrieve device details.
```javascript
console.log(Flxy.device.getId()); // Retrieves unique device ID
console.log(Flxy.device.getBrowserInfo()); // Returns browser details
console.log(Flxy.device.getCapabilities()); // Detects touch support & screen resolution
console.log(Flxy.device.getNetworkInfo()); // Provides network connection details
console.log(Flxy.device.getDeviceType()); // Identifies device type (mobile, desktop, etc.)
```

### **3. Auto-Translation of Templates**
Flxy.js supports inline auto-translation in templates.
```html
<p>Welcome to the site, _('greeting')</p>
```
When `Flxy.translator.load("en")` is called, this text will be automatically translated.

---
## Detailed Module Breakdown
### **1. State Management (`state.js`)**
Handles application-wide state with persistence.
#### **Example Use Cases:**
```javascript
Flxy.states.set("theme", "dark");
console.log(Flxy.states.get("theme")); // Output: 'dark'
Flxy.states.subscribe("theme", (key, value) => console.log(`${key} changed to ${value}`));
```

### **2. Routing (`router.js`)**
Manages client-side routing dynamically.
#### **Methods:**
- `Flxy.router.register(route, handler, ...middlewares)` - Registers a route with optional middleware functions.
- `Flxy.router.navigate(route)` - Navigates to a registered route.
- `Flxy.router.use(middleware)` - Adds middleware to routes.
- `Flxy.router.handle(callback)` - Handles route changes dynamically.

#### **Example Use Cases:**
```javascript
const authMiddleware = (request, next) => {
    if (!localStorage.getItem("token")) {
        console.log("Unauthorized access");
        return;
    }
    next();
};

Flxy.router.register("/dashboard", authMiddleware, (request) => {
    console.log("Dashboard loaded", request);
});

Flxy.router.navigate("/dashboard");
```
The `request` object contains route parameters and query strings that can be used inside the handler function. Middleware functions can modify the request before passing it to the handler.

### **3. API Handling (`api.js`)**
Handles API requests with middleware support.
#### **Example Use Cases:**
```javascript
Flxy.api.configure({ baseEndpoint: "https://api.example.com" });
Flxy.api.get("/users").then(console.log);
```

### **4. Event System (`emitter.js`)**
Implements a pub-sub pattern for event-driven architecture.
#### **Example Use Cases:**
```javascript
Flxy.emitter.on("userLoggedIn", (user) => console.log("User logged in:", user));
Flxy.emitter.emit("userLoggedIn", { name: "John Doe" });
```

### **5. Performance Monitoring (`performance.js`)**
Tracks execution time for specific operations.
#### **Example Use Cases:**
```javascript
const tracker = Flxy.performance.start("Database Query");
setTimeout(() => tracker.end(), 500);
```

---
## Example Projects
For real-world examples, check out:
- **BoostX**: [GitHub Repo](https://github.com/deepansumor/BoostX) - Productivity and task management app.
- **WeatherPro**: [GitHub Repo](https://github.com/deepansumor/WeatherPro) - Weather forecasting application.

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
