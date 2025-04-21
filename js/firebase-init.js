// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { getAuth, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// You can export the initialized app instance if needed elsewhere
export default app;

const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Firebase persistence set to SESSION");
  })
  .catch((error) => {
    console.error("Error setting Firebase persistence:", error);
  });

// Optionally, you can also initialize other Firebase services here and export them
// Example for Auth:
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
// export const auth = getAuth(app);

// Example for Firestore:
// import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
// export const db = getFirestore(app);

console.log("Firebase initialized successfully!"); // Optional: Confirmation message
