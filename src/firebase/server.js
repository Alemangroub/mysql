
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: This file uses Astro's import.meta.env to access environment variables.
// This is the recommended way for Astro projects to ensure variables are available
// both during build and in the server-side runtime environment.

function getInitializedApp() {
    // If an app is already initialized, return it to prevent re-initialization.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Read the consolidated credentials from the single environment variable.
    const serviceAccountJSON = import.meta.env.FIREBASE_ADMIN_SDK_CONFIG;

    if (!serviceAccountJSON) {
        console.error(
            '\n❌ [server.js] FIREBASE ADMIN SDK INITIALIZATION FAILED ❌\n' +
            'The FIREBASE_ADMIN_SDK_CONFIG environment variable is missing.\n' +
            'Please ensure this secret is set in your deployment environment.\n'
        );
        return null;
    }

    try {
        // Parse the JSON string from the environment variable to get the service account object.
        const serviceAccount = JSON.parse(serviceAccountJSON);

        // Initialize the Firebase Admin SDK with the credentials object.
        console.log('[server.js] Initializing Firebase Admin SDK from config secret...');
        const app = initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('✅ [server.js] Firebase Admin SDK initialized successfully.');
        return app;
    } catch (error) {
        console.error('❌ [server.js] Firebase Admin SDK initialization threw an error:', error);
        // This could be a JSON parsing error or an SDK initialization error.
        return null;
    }
}

// Export a function to get the authentication service.
// It throws a clear error if initialization failed.
export function getAdminAuth() {
    const app = getInitializedApp();
    if (!app) {
        throw new Error('Firebase Admin SDK is not available. Check server logs for initialization errors.');
    }
    return getAuth(app);
}

// Export a function to get the Firestore database service.
// It also throws a clear error if initialization failed.
export function getAdminDb() {
    const app = getInitializedApp();
    if (!app) {
        throw new Error('Firebase Admin SDK is not available. Check server logs for initialization errors.');
    }
    return getFirestore(app);
}
