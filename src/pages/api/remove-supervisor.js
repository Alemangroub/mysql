
import { getAdminDb } from '../../firebase/server.js';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST({ request }) {
    if (request.headers.get("Content-Type") !== "application/json") {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), { status: 415 });
    }

    try {
        const adminDb = getAdminDb();
        const { projectId, supervisorId } = await request.json();

        if (!projectId || !supervisorId) {
            return new Response(JSON.stringify({ error: "Project ID and Supervisor ID are required" }), { status: 400 });
        }

        const projectRef = adminDb.collection("projects").doc(projectId);

        // Atomically remove the supervisor ID from the `supervisorIds` array.
        await projectRef.update({
            supervisorIds: FieldValue.arrayRemove(supervisorId)
        });

        return new Response(JSON.stringify({ message: "Supervisor removed successfully" }), { status: 200 });

    } catch (error) {
        console.error("Error removing supervisor:", error);
        let errorMessage = "An internal server error occurred.";
         if (error.message.includes('Firebase Admin SDK is not available')) {
            errorMessage = 'Firebase Admin SDK initialization failed on the server. Check environment variables.';
        }
        return new Response(JSON.stringify({ 
            error: errorMessage, 
            details: error.message 
        }), { status: 500 });
    }
}
