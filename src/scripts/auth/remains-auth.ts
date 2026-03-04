import { auth, db } from "../../firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth"; // Explicitly import 'User' as a type
import { doc, getDoc } from "firebase/firestore";

// Define a callback function type that accepts user and role
type AuthCallback = (user: User, userRole: string) => void;

export function initializeAuthCheck(callback?: AuthCallback) {
  // This listener is attached once and should be safe across page transitions
  // as long as the page re-executes scripts.
  document.addEventListener('DOMContentLoaded', () => {
    const authLoadingMessage = document.getElementById('auth-loading-message');
    const pageContent = document.getElementById('page-content') as HTMLElement | null;

    if (!pageContent) {
      console.error("Page content element not found!");
      if(authLoadingMessage) authLoadingMessage.textContent = 'حدث خطأ في تحميل الصفحة.';
      return;
    }

    const projectExists = pageContent.dataset.projectExists === 'true';
    
    const showPageContent = () => {
      if (authLoadingMessage) authLoadingMessage.style.display = 'none';
      if (pageContent) pageContent.style.display = 'block';
    };

    // If project doesn't exist, just show the error message from the .astro file
    if (!projectExists) {
      showPageContent();
      return; 
    }

    const unauthorizedRedirect = () => {
      window.location.href = '/crs'; // Redirect to a generic login/access-denied page
    };

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role;
            
            const isAdmin = userRole === 'admin';
            
            const supervisorIdsString = pageContent.dataset.supervisorIds;
            const supervisorIds = supervisorIdsString ? JSON.parse(supervisorIdsString) : [];
            const isProjectSupervisor = supervisorIds.includes(user.uid);

            if (isAdmin || isProjectSupervisor) {
              // Show role-specific elements
              const adminElements = pageContent.querySelectorAll('.admin-only');
              const supervisorElements = pageContent.querySelectorAll('.supervisor-only');

              if (isAdmin) {
                adminElements.forEach(el => (el as HTMLElement).style.display = 'block');
                supervisorElements.forEach(el => (el as HTMLElement).style.display = 'none');
              } else { // isProjectSupervisor
                supervisorElements.forEach(el => (el as HTMLElement).style.display = 'block');
                adminElements.forEach(el => (el as HTMLElement).style.display = 'none');
              }

              showPageContent();

              // If a callback is provided, execute it with user details
              if (callback) {
                callback(user, userRole);
              }

            } else {
              unauthorizedRedirect();
            }
          } else {
            // User document doesn't exist
            unauthorizedRedirect();
          }
        } catch (error) {
          console.error("Authorization check failed:", error);
          unauthorizedRedirect();
        }
      } else {
        // No user is signed in
        unauthorizedRedirect();
      }
    });
  });
}
