import STATES from "../utils/states.js";

const Translator = {
    currentLang: null, // Default language
    translations: {},  // Store loaded translations
};

/**
 * Load the translation JSON for the given language.
 * @param {string} lang - The language code (e.g., 'en', 'fr').
 * @returns {Promise<void>} - Resolves when the translation file is loaded.
 */
export async function load(lang, callback = null) {
    if (Translator.translations[lang]) {
        if (typeof callback === "function") callback(); // Execute the callback immediately if translations are cached
        return;
    }

    Translator.translations[lang] = STATES.FETCHING; // Mark as fetching
    try {
        const response = await fetch(`/translations/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Language file ${lang} not found`);
        }

        const data = await response.json();

        Translator.translations[lang] = data;
        Translator.currentLang = lang;

    } catch (err) {
        Translator.translations[lang] = STATES.NULL; // Mark as failed
        console.error(err);
        // throw err;
    }

    if (typeof callback === "function") return callback(); // Execute callback fetch

}

/**
 * Get the translation for a given key with optional parameters.
 * @param {string} key - The key of the translation (e.g., 'greeting', 'error.notFound').
 * @param {object} [params] - Optional parameters to replace placeholders in the translation.
 * @returns {string} - The translated string or the key itself if not found.
 */
export function getByKey(key, params = {}) {
    const keys = key.split('.'); // Split key by dot notation (e.g., 'error.notFound')
    let translation = Translator.translations[Translator.currentLang];
    // Traverse the nested objects using the split keys
    for (let k of keys) {
        if (translation && translation[k]) {
            translation = translation[k];
        } else {
            return `_${key}_`; // Return the key as fallback (wrapped in underscores)
        }
    }

    // Replace placeholders with actual parameter values
    return replacePlaceholders(translation, params);
}

/**
 * Replace placeholders in a translation string with parameter values.
 * Supports nested object keys like {address.city}.
 * @param {string} str - The translation string containing placeholders (e.g., 'Hello {name}' or 'Hello {address.city}').
 * @param {object} params - The parameters to replace (e.g., { name: 'Alex', address: { city: 'New York' } }).
 * @returns {string} - The string with placeholders replaced by actual values.
 */
export function replacePlaceholders(str, params) {
    return str.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, key) => {
        const keys = key.split('.'); // Split nested keys like 'address.city' into ['address', 'city']
        let value = params;

        // Traverse the nested keys in the params object
        for (let k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return match; // Return the original placeholder if the key doesn't exist
            }
        }

        return value !== undefined ? value : match; // Replace or keep the placeholder if not found
    });
}


/**
 * Replace all occurrences of _key_ in the string with the translated values.
 * @param {string} str - The string to be translated (can contain _key_ with keys).
 * @param {object} [params] - Optional parameters to replace placeholders in the translations.
 * @returns {string} - The string with translated values and replaced placeholders.
 */
export async function translate(str, params = {}) {

    if(!Translator.currentLang){
        console.warn('No language set!, Please set a language using Translator.init(lang) before calling translate()');
        return str;
    };

    const isFetching = Translator.translations[Translator.currentLang] === STATES.FETCHING;
    const isMissing = !Translator.translations[Translator.currentLang];

    // Fallback callback for string replacement
    const processString = () => str.replace(/_([^_]+)_/g, (match, key) => getByKey(key, params) || match);

    if (isMissing || isFetching) {
        try {
            console.warn(`isMissing | isFetching`, isFetching,isMissing);
            return await load(Translator.currentLang, processString);
        } catch (error) {
            console.error(`Translation loading failed for language: ${Translator.currentLang}`, error);
            return str; // Return the original string as a fallback
        }
    } else {
        console.log('Alread Loaded', Translator.currentLang);
    }

    return processString();
}

/**
 * Initialize the Translator by loading the default language.
 * @example
 * Translator.init(); // Initializes the translator with the default language (en).
 */
export async function init(lang) {
    lang && await load(lang);
}

export default Translator;