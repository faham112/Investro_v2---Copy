import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_RFY98xrBfLpYz3c_zw-fJc6pieGcA88",
  authDomain: "webappfinal112.firebaseapp.com",
  projectId: "webappfinal112",
  storageBucket: "webappfinal112.firebasestorage.app",
  messagingSenderId: "82896269063",
  appId: "1:82896269063:web:37ecddbe1ab34407675fa2",
  measurementId: "G-XV090SK0VK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Obtain analytics instance
firebase.analytics();

module.exports = firebase;
