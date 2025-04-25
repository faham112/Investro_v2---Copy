import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var messageContainer = document.getElementById('messageContainer');
    var loadingIndicator = document.getElementById('loadingIndicator');

    let email = username;

    loadingIndicator.style.display = 'block'; // Show loading indicator

    try {
      const auth = getAuth(app);
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', email);
          localStorage.setItem('loginTime', new Date().getTime());

          userCredential.user.getIdToken().then(function(idToken) {
            localStorage.setItem('jwtToken', idToken);
            messageContainer.innerHTML = '<p style="color: green;">Login successful!</p>';
            window.location.href = '/pages/user/dashboard.html';
            loadingIndicator.style.display = 'none';
          });
        })
        .catch((error) => {
          var errorMessage = error.message;
          messageContainer.innerHTML = '<p style="color: red;">Login failed: ' + errorMessage + '</p>';
          loadingIndicator.style.display = 'none';
        });
    } catch (error) {
        messageContainer.innerHTML = '<p style="color: red;">Login failed: ' + error.message + '</p>';
        loadingIndicator.style.display = 'none';
    }
});
