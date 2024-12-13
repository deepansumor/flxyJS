const Translator = {
    currentLang: 'en', // Default language
    translations: {},  // Store loaded translations

    /**
     * Load the translation JSON for the given language.
     * @param {string} lang - The language code (e.g., 'en', 'fr').
     * @returns {Promise} - Resolves when the translation file is loaded.
     */
    load(lang) {
        return new Promise((resolve, reject) => {
            // Check if translations are already cached
            if (this.translations[lang]) {
                resolve();  // Return immediately if translations are cached
                return;
            }

            fetch(`/translations/${lang}.json`)
                .then(response => {
                    if (!response.ok) throw new Error(`Language file ${lang} not found`);
                    return response.json();
                })
                .then(data => {
                    this.translations[lang] = data;
                    this.currentLang = lang;
                    resolve();
                })
                .catch(err => reject(err));
        });
    },

    /**
     * Get the translation for a given key.
     * @param {string} key - The key of the translation (e.g., 'greeting', 'error.notFound').
     * @returns {string} - The translated string or the key itself if not found.
     */
    getByKey(key) {
        const keys = key.split('.');  // Split key by dot notation (e.g., 'error.notFound')
        let translation = this.translations[this.currentLang];

        // Traverse the nested objects using the split keys
        for (let k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return `_${key}_`;  // Return the key as fallback (wrapped in underscores)
            }
        }
        return translation;
    },

    /**
     * Replace all occurrences of _key_ in the string with the translated values.
     * @param {string} str - The string to be translated (can contain _key_ with keys).
     * @returns {string} - The string with translated values.
     */
    async translate(str) {
        // Ensure the current language translations are loaded
        if (!this.translations[this.currentLang]) {
            await this.load(this.currentLang);
        }
        
        // Replace all occurrences of _key_ with the translated values
        return str.replace(/_([^_]+)_/g,  (match, p1) => {
            // Get the translation for the key (await if necessary)
            const translation = this.getByKey(p1) ;
            return translation || match;  // If translation is not found, return the original match
        });
    },
    

    /**
     * Initialize the Translator by loading the default language.
     * @example
     * Translator.init(); // Initializes the translator with the default language (en).
     */
    async init() {
        await this.load(this.currentLang)
    },
};

export default Translator;
