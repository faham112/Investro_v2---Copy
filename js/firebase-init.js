// firebase-init.js
// firebase-init.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import firebaseConfig from './firebase-config.js';

let app;

// Check if Firebase App instance already exists
if (!getApps().length) {
  // Initialize Firebase ONLY if it hasn't been initialized yet
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized!"); // Add a log to confirm
} else {
  // Get the already initialized app
  app = getApps()[0];
  console.log("Firebase already initialized."); // Add a log
}

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistence set to local");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Export the initialized app instance and auth functions
export default auth;
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };

// Optionally, you can also initialize other Firebase services here and export them
// Example for Auth:
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
// export const auth = getAuth(app);

// Example for Firestore:
// import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
// export const db = getFirestore(app);

console.log("Firebase initialized successfully!"); // Optional: Confirmation message
