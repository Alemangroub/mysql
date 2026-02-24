
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This function will be called to get an initialized app instance.
function getInitializedApp() {
    // If already initialized, return the app.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // If not initialized, try to initialize.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // During the build process (`astro build`), this variable might not be available.
    // We return null so the build doesn't crash.
    if (!serviceAccountString) {
        console.warn('[server.js] FIREBASE_SERVICE_ACCOUNT env var not found. Admin SDK not initialized. This is expected during build.');
        return null;
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        console.log('[server.js] Initializing Firebase Admin SDK...');
        const app = initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('[server.js] Firebase Admin SDK initialized successfully.');
        return app;
    } catch (e) {
        console.error('[server.js] ERROR: Failed to parse or initialize Firebase Admin SDK.');
        console.error(e);
        // Return null if initialization fails.
        return null;
    }
}

// Export functions that provide the auth and db services.
// They will attempt to get the initialized app each time they are called.
// This ensures that if initialization failed during build, it can be retried on a server-side request.
export function getAdminAuth() {
    const app = getInitializedApp();
    if (!app) {
        throw new Error('Firebase Admin SDK is not available. Check server logs for initialization errors.');
    }
    return getAuth(app);
}

export function getAdminDb() {
    const app = getInitializedApp();
    if (!app) {
        throw new Error('Firebase Admin SDK is not available. Check server logs for initialization errors.');
    }
    return getFirestore(app);
}
