
import type { APIRoute } from 'astro';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '../../../../firebase/server';

const auth = getAuth(app);
const db = getFirestore(app);

export const POST: APIRoute = async ({ request, redirect }) => {
  // 1. Authenticate the admin making the request
  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: No token provided.' }),
      { status: 401 }
    );
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const adminDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Not an admin.' }),
        { status: 403 }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid token.' }),
      { status: 401 }
    );
  }

  // 2. Get user data from the request body
  const { uid, name, email, role, password } = await request.json();

  if (!uid || !name || !email || !role) {
    return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400 }
    );
  }

  try {
    // 3. Prepare updates for Firebase Auth
    const authUpdates: { email?: string; password?: string } = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;

    // Update Firebase Auth user
    if (Object.keys(authUpdates).length > 0) {
        await auth.updateUser(uid, authUpdates);
    }
    
    // 4. Prepare updates for Firestore
    const firestoreUpdates = {
        name,
        email,
        role
    };

    // Update Firestore document
    await db.collection('users').doc(uid).update(firestoreUpdates);

    // 5. Update custom claims for the role if it has changed
    await auth.setCustomUserClaims(uid, { role });

    // 6. Return success response
    return new Response(JSON.stringify({ message: 'User updated successfully' }), {
      status: 200,
    });

  } catch (error: any) {
    console.error("Error updating user:", error);
    let errorMessage = 'An unexpected error occurred.';
    // Provide more specific error messages from Firebase Admin SDK
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email address is already in use by another account.';
    } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. They may have been deleted.';
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
};
