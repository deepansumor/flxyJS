
/**
 * String manipulation helpers.
 */
export const str = {
    /**
     * Converts a string to title case (e.g., "hello world" -> "Hello World").
     * @param {string} str - The string to convert.
     * @returns {string} - The string in title case.
     */
    toTitleCase(str) {
        return String(str).replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
    },

    /**
     * Converts a string to lowercase (e.g., "HELLO" -> "hello").
     * @param {string} str - The string to convert.
     * @returns {string} - The string in lowercase.
     */
    toLowerCase(str) {
        return str.toLowerCase();
    },

    /**
     * Converts a string to uppercase (e.g., "hello" -> "HELLO").
     * @param {string} str - The string to convert.
     * @returns {string} - The string in uppercase.
     */
    toUpperCase(str) {
        return str.toUpperCase();
    },

    /**
     * Converts a string to a "hidden" case by replacing letters with asterisks (e.g., "password" -> "********").
     * @param {string} str - The string to convert.
     * @returns {string} - The string in "hidden" case.
     */
    toHiddenCase(str) {
        return '*'.repeat(str.length);
    }
};

