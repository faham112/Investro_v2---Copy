// Firebase configuration (ensure Firebase SDKs are loaded via CDN in HTML)
// TODO: Add SDKs for Firebase products that you want to use via CDN
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_RFY98xrBfLpYz3c_zw-fJc6pieGcA88",
  authDomain: "webappfinal112.firebaseapp.com",
  databaseURL: "https://webappfinal112-default-rtdb.firebaseio.com/",
  projectId: "webappfinal112",
  storageBucket: "webappfinal112.firebasestorage.app",
  messagingSenderId: "82896269063",
  appId: "1:82896269063:web:37ecddbe1ab34407675fa2",
  measurementId: "G-XV090SK0VK"
};

// Initialize Firebase (assumes firebase object is available globally from CDN)
const app = firebase.initializeApp(firebaseConfig);

// Note: firebaseConfig is now a global constant in this script's scope
// Other scripts loaded after this one can potentially access it,
// though it's better practice to explicitly pass configuration if needed.
