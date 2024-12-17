import STATES from "../utils/states.js";

const Translator = {
    currentLang: 'en', // Default language
    translations: {},  // Store loaded translations

    /**
     * Load the translation JSON for the given language.
     * @param {string} lang - The language code (e.g., 'en', 'fr').
     * @returns {Promise<void>} - Resolves when the translation file is loaded.
     */
    async load(lang, callback = null) {
        if (this.translations[lang]) {
            if (typeof callback === "function") callback(); // Execute the callback immediately if translations are cached
            return;
        }

        this.translations[lang] = STATES.FETCHING; // Mark as fetching
        try {
            const response = await fetch(`/translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Language file ${lang} not found`);
            }

            const data = await response.json();

            this.translations[lang] = data;
            this.currentLang = lang;

            if (typeof callback === "function") return callback(); // Execute callback after successful fetch
        } catch (err) {
            this.translations[lang] = STATES.NULL; // Mark as failed
            console.error(err);
            throw err;
        }
    }
    ,

    /**
     * Get the translation for a given key with optional parameters.
     * @param {string} key - The key of the translation (e.g., 'greeting', 'error.notFound').
     * @param {object} [params] - Optional parameters to replace placeholders in the translation.
     * @returns {string} - The translated string or the key itself if not found.
     */
    getByKey(key, params = {}) {
        const keys = key.split('.'); // Split key by dot notation (e.g., 'error.notFound')
        let translation = this.translations[this.currentLang];
        // Traverse the nested objects using the split keys
        for (let k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return `_${key}_`; // Return the key as fallback (wrapped in underscores)
            }
        }

        // Replace placeholders with actual parameter values
        return this.replacePlaceholders(translation, params);
    },

    /**
     * Replace placeholders in a translation string with parameter values.
     * @param {string} str - The translation string containing placeholders (e.g., 'Hello {name}').
     * @param {object} params - The parameters to replace (e.g., { name: 'Alex' }).
     * @returns {string} - The string with placeholders replaced by actual values.
     */
    replacePlaceholders(str, params) {
        return str.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match; // Replace or keep the placeholder
        });
    },

    /**
     * Replace all occurrences of _key_ in the string with the translated values.
     * @param {string} str - The string to be translated (can contain _key_ with keys).
     * @param {object} [params] - Optional parameters to replace placeholders in the translations.
     * @returns {string} - The string with translated values and replaced placeholders.
     */
    async translate(str, params = {}) {
        const isFetching = this.translations[this.currentLang] === STATES.FETCHING;
        const isMissing = !this.translations[this.currentLang];

        // Fallback callback for string replacement
        const processString = () => str.replace(/_([^_]+)_/g, (match, key) => this.getByKey(key, params) || match);

        if (isMissing || isFetching) {
            try {
                return await this.load(this.currentLang,processString);
            } catch (error) {
                console.error(`Translation loading failed for language: ${this.currentLang}`, error);
                return str; // Return the original string as a fallback
            }
        }else{
            console.log('loaded')
        }

        return processString();
    },

    /**
     * Initialize the Translator by loading the default language.
     * @example
     * Translator.init(); // Initializes the translator with the default language (en).
     */
    async init() {
        await this.load(this.currentLang);
    },
};

Translator.init();

export default Translator;