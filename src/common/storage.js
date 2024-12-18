// Helper function to add a prefix to the given key or name.
const storage = {
  prefix: "",

  /**
   * Helper function to get the full key with prefix.
   *
   * @param {string} name The name or key.
   * @returns {string} The key with the prefix added.
   */
  key(name) {
    return this.prefix + name;
  },

  /**
   * Helper object for working with cookies.
   */
  cookie: {
    /**
     * Get the value of a cookie by name.
     *
     * @param {string} name The name of the cookie.
     * @returns {string|undefined} The value of the cookie, or undefined if not found.
     */
    get(name) {
      const key = storage.key(name); // Add a prefix to the name

      const value = "; " + document.cookie;
      const parts = value.split("; " + key + "=");
      if (parts.length === 2) {
        return parts.pop().split(";").shift();
      }
    },

    /**
     * Set a cookie with the given name, value, and optional expiration days.
     *
     * @param {string} name  The name of the cookie.
     * @param {string} value The value to set for the cookie.
     * @param {number} days  Optional number of days until the cookie expires.
     */
    set(name, value, days) {
      const key = storage.key(name); // Add a prefix to the name

      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = key + "=" + value + expires + "; path=/";
    },

    /**
     * Delete a cookie with the given name.
     *
     * @param {string} name The name of the cookie to delete.
     */
    delete(name) {
      const key = storage.key(name); // Add a prefix to the name

      document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
    },
  },

  /**
   * Helper object for working with local storage.
   */
  local: {
    /**
     * Get the value of a local storage item by key.
     *
     * @param {string} key The key of the local storage item.
     * @returns {string|undefined} The value of the local storage item, or undefined if not found.
     */
    get(key) {
      const prefixedKey = storage.key(key); // Add a prefix to the key
      const item = localStorage.getItem(prefixedKey);
      if (!item) return undefined;

      const parsedItem = JSON.parse(item);
      const { value, timestamp } = parsedItem;

      // Check if the item has expired
      if (timestamp && Date.now() > timestamp) {
        localStorage.removeItem(prefixedKey);
        return undefined;
      }

      return value;
    },

    /**
     * Set a local storage item with the given key and value.
     *
     * @param {string} key   The key of the local storage item.
     * @param {string} value The value to set for the local storage item.
     * @param {number} [expirationDays] Optional number of days until the item expires.
     */
    set(key, value, expirationDays) {
      const prefixedKey = storage.key(key); // Add a prefix to the key

      const timestamp = expirationDays ? Date.now() + expirationDays * 24 * 60 * 60 * 1000 : null;
      const item = JSON.stringify({ value, timestamp });
      localStorage.setItem(prefixedKey, item);
    },

    /**
     * Delete a local storage item with the given key.
     *
     * @param {string} key The key of the local storage item to delete.
     */
    delete(key) {
      const prefixedKey = storage.key(key); // Add a prefix to the key

      localStorage.removeItem(prefixedKey);
    },
  },

  /**
   * Helper object for working with session storage.
   */
  session: {
    /**
     * Get the value of a session storage item by key.
     *
     * @param {string} key The key of the session storage item.
     * @returns {string|undefined} The value of the session storage item, or undefined if not found.
     */
    get(key) {
      const prefixedKey = storage.key(key); // Add a prefix to the key
      const item = sessionStorage.getItem(prefixedKey);
      if (!item) return undefined;

      const parsedItem = JSON.parse(item);
      const { value, timestamp } = parsedItem;

      // Check if the item has expired
      if (timestamp && Date.now() > timestamp) {
        sessionStorage.removeItem(prefixedKey);
        return undefined;
      }

      return value;
    },

    /**
     * Set a session storage item with the given key and value.
     *
     * @param {string} key   The key of the session storage item.
     * @param {string} value The value to set for the session storage item.
     * @param {number} [expirationDays] Optional number of days until the item expires. or session ends
     */
    set(key, value, expirationDays) {
      const prefixedKey = storage.key(key); // Add a prefix to the key

      const timestamp = expirationDays ? Date.now() + expirationDays * 24 * 60 * 60 * 1000 : null;
      const item = JSON.stringify({ value, timestamp });
      sessionStorage.setItem(prefixedKey, item);
    },

    /**
     * Delete a session storage item with the given key.
     *
     * @param {string} key The key of the session storage item to delete.
     */
    delete(key) {
      const prefixedKey = storage.key(key); // Add a prefix to the key

      sessionStorage.removeItem(prefixedKey);
    },
  },
};

// Export the helper methods
export const storageHelper = storage;
export const { cookie, local, session } = storageHelper;