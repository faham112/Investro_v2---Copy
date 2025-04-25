import { auth, createUserWithEmailAndPassword, db, ref, set } from './firebase-init.js';

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageContainer = document.getElementById('messageContainer');

    if (!fullName) {
        messageContainer.innerHTML = '<p style="color: red;">Full name cannot be empty!</p>';
        return;
    }

    if (!email) {
        messageContainer.innerHTML = '<p style="color: red;">Email cannot be empty!</p>';
        return;
    }

    if (password !== confirmPassword) {
        messageContainer.innerHTML = '<p style="color: red;">Passwords do not match!</p>';
        return;
    }

    try {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;

          // Store user data in Firebase
          set(ref(db, 'users/' + user.uid), {
            fullName: fullName,
            email: email
          });

          messageContainer.innerHTML = '<p style="color: green;">Registration successful!</p>';
          // Optionally redirect to login page after successful registration
          window.location.href = 'login.html';
        })
        .catch((error) => {
          var errorMessage = error.message;
          messageContainer.innerHTML = '<p style="color: red;">Registration failed: ' + errorMessage + '</p>';
        });
    } catch (error) {
        messageContainer.innerHTML = '<p style="color: red;">Registration failed: ' + error.message + '</p>';
    }
});
