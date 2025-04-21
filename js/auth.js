// auth.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import app from './firebase-init.js'; // Ensure firebase-init.js is correctly imported

const auth = getAuth(app);

// --- Authentication Functions ---

// Register a new user
export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
  // Add .then() and .catch() in your calling code to handle success/error
};

// Sign in an existing user
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
  // Add .then() and .catch() in your calling code to handle success/error
};

// Sign out the current user
export const logoutUser = () => {
  return signOut(auth);
  // Add .then() and .catch() in your calling code to handle success/error
};

// --- Authentication State Observer ---

// Listen for changes in authentication state (e.g., user logs in or out)
export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      console.log("User is signed in:", user);
      callback(user); // Pass user object to the callback
    } else {
      // User is signed out
      console.log("User is signed out");
      callback(null); // Pass null to the callback
    }
  });
  // The function returns an unsubscribe function that can be called to stop listening
};

// Example usage of observeAuthState (place this in your main app logic file, e.g., app.js):
/*
import { observeAuthState } from './auth.js';

observeAuthState((user) => {
  if (user) {
    // Update UI for logged-in user
    // e.g., show user profile, hide login form
  } else {
    // Update UI for logged-out user
    // e.g., show login form, hide user profile
  }
});
*/

console.log("Firebase Auth module loaded.");
