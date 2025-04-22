// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
