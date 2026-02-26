
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';

function getInitializedApp() {
    // If the app is already initialized, return it.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Check if running in a Firebase/Google Cloud production or emulator environment
    // The SDK will automatically find the credentials in these environments.
    if (process.env.GCP_PROJECT || process.env.FUNCTIONS_EMULATOR) {
        console.log('[server.js] Running in a Firebase environment. Initializing default app...');
        try {
            const app = initializeApp();
            console.log('✅ [server.js] Firebase Admin SDK initialized successfully in production/emulator.');
            return app;
        } catch (error) {
            console.error('❌ [server.js] Default Firebase Admin SDK initialization failed:', error);
            return null;
        }
    } else {
        // Fallback for local development environment
        console.log('[server.js] Running in local development. Attempting to use service account key file.');
        try {
            // Use a robust relative path to find the key file at the project root
            const serviceAccountPath = path.resolve('./serviceAccountKey.json');
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            
            console.log('[server.js] Initializing Firebase Admin SDK from local service account file...');
            const app = initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('✅ [server.js] Firebase Admin SDK initialized successfully from local file.');
            return app;
        } catch (error) {
            // If the file doesn't exist, it's not a critical error for the whole app,
            // just for the admin functionality locally.
            if (error.code === 'ENOENT') {
                console.warn('⚠️ [server.js] Local `serviceAccountKey.json` not found. Admin features requiring this key will not work in the local development environment.');
            } else {
                console.error('❌ [server.js] Could not initialize from local service account file:', error);
            }
            return null;
        }
    }
}

// Export auth and firestore instances
export function getAdminAuth() {
    const app = getInitializedApp();
    return app ? getAuth(app) : null;
}

export function getAdminDb() {
    const app = getInitializedApp();
    return app ? getFirestore(app) : null;
}
