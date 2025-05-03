import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from './firebase-config.js';
import ADMIN_USER from './admin/admin-constants.js';

const app = initializeApp(firebaseConfig);

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var messageContainer = document.getElementById('messageContainer');
    var loadingIndicator = document.getElementById('loadingIndicator');

    if (username === ADMIN_USER.userid && password === ADMIN_USER.pass) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('loginTime', new Date().getTime());
        localStorage.setItem('isAdmin', 'true');
        messageContainer.innerHTML = '<p style="color: green;">Admin Login successful!</p>';
        window.location.href = '/pages/admin/dashboard.html';
        loadingIndicator.style.display = 'none';
        return;
    }

    let email = username;

    loadingIndicator.style.display = 'block';

    if (username !== ADMIN_USER.userid) {
      try {
        const auth = getAuth(app);
          signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', email);
            localStorage.setItem('loginTime', new Date().getTime());

          userCredential.user.getIdToken().then(function(idToken) {
            localStorage.setItem('loginTime', new Date().getTime());
            localStorage.setItem('jwtToken', idToken);
            localStorage.setItem('sessionToken', idToken);
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
  }
});
