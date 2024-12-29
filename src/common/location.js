
const module = {
   
};

const GEO_LOCATION_API = "https://get.geojs.io/v1";

export const STATES = {
    GRANTED:"granted",
    DENIED:"denied",
    PROMPT:"prompt"
}

/**
 * Initializes the Flxy by fetching the user's current location.
 * Uses navigator's geolocation API if permission is granted, otherwise falls back to IP-based geolocation.
 */
export default async function init() {
    try {
        // Check for geolocation permission and fetch approximate location
        const { latitude, longitude } = await ((await checkLocationPermission())
            ? getLatLongFromNavigator()
            : getApproximateLocation());

        // Log the fetched location details
        console.log('Location:', latitude, longitude);
        module.location = { latitude:+latitude, longitude:+longitude };
        return module.location;

    } catch (error) {
        // Log any initialization error
        console.error('Error during initialization:', error);
    }
}

export async function get() {
    return module.location ? module.location : await init();
}

/**
 * Fetches location based on IP if geolocation permission is not granted.
 * Uses a third-party API to retrieve approximate location data.
 * @returns {Promise<Object>} Location object containing latitude and longitude.
 */
async function getApproximateLocation() {
    try {
        // Fetch location data based on IP from a geolocation API
        const response = await fetch(`${GEO_LOCATION_API}/ip/geo.json`);
        if (!response.ok) throw new Error('Failed to fetch IP-based geolocation data');

        // Return the parsed location data
        return await response.json();
    } catch (error) {
        // Log any errors encountered during the fetch
        console.error('Error fetching IP-based location:', error);
        return { latitude: null, longitude: null }; // Default values if location fails
    }
}

/**
 * Retrieves the state of the geolocation permission.
 * @returns {Promise<String>} The state of the geolocation permission ('granted', 'denied', or 'prompt').
 */
export async function getLocationPermissionState() {
    try {
        // Query the navigator for geolocation permission state
        const { state } = await navigator.permissions.query({ name: 'geolocation' });
        return state; // Return the permission state
    } catch (error) {
        // Log any errors during permission retrieval
        console.error('Error retrieving geolocation permission state:', error);
        return 'unknown'; // Return 'unknown' if an error occurs
    }
}

/**
 * Checks if the application has permission to access the user's geolocation.
 * @returns {Promise<Boolean>} Whether geolocation permission is granted.
 */
export async function checkLocationPermission() {
    const state = await getLocationPermissionState(); // Get the permission state
    return state === STATES.GRANTED; // Return true if permission is granted
}


/**
 * Fetches the user's current latitude and longitude using the navigator's geolocation API.
 * @returns {Promise<Object>} Object containing latitude and longitude.
 */
export async function getLatLongFromNavigator() {
    return new Promise((resolve, reject) => {
        // Attempt to fetch geolocation data from the navigator
        navigator.geolocation.getCurrentPosition(
            position => {
                // Resolve the promise with location data if successful
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                // Log geolocation errors and reject the promise with default values
                console.error('Geolocation error:', error);
                reject({ latitude: null, longitude: null });
            }
        );
    });
}

/**
 * Prompts the user to grant geolocation access by requesting their current position.
 * @returns {Promise<Boolean>} Whether geolocation permission was granted after the prompt.
 */
export async function promptForLocationPermission() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            resolve(false); // Return false if geolocation is not supported
            return;
        }

        // Attempt to get the user's current position
        navigator.geolocation.getCurrentPosition(
            () => resolve(true), // Permission granted
            (error) => {
                console.error('Error prompting for geolocation permission:', error);
                resolve(false); // Permission denied or an error occurred
            }
        );
    });
}

