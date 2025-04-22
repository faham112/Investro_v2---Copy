const firebase = require("firebase/app");
require("firebase/auth");
const app = require('./firebase-config.js');

const auth = firebase.auth();

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const userId = document.getElementById('userId').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageContainer = document.getElementById('messageContainer');

    if (password !== confirmPassword) {
        messageContainer.innerHTML = '<p style="color: red;">Passwords do not match!</p>';
        return;
    }

    try {
        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          var user = userCredential.user;
          // Store the userId as a custom claim (not implemented)
          // In a real application, you would store the userId as a custom claim in Firebase
          console.log("Storing userId as a custom claim (not implemented)");

          messageContainer.innerHTML = '<p style="color: green;">Registration successful!</p>';
          // Optionally redirect to login page after successful registration
          window.location.href = 'login.html';
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
          messageContainer.innerHTML = '<p style="color: red;">Registration failed: ' + errorMessage + '</p>';
        });
    } catch (error) {
        console.error("Registration failed:", error);
        messageContainer.innerHTML = '<p style="color: red;">Registration failed: ' + error.message + '</p>';
    }
});
