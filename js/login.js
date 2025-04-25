import { auth, signInWithEmailAndPassword } from './firebase-init.js';

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var messageContainer = document.getElementById('messageContainer');
    var loadingIndicator = document.getElementById('loadingIndicator');

    let email = username;

    loadingIndicator.style.display = 'block'; // Show loading indicator

    try {
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          // Set session information in localStorage
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', email);
          localStorage.setItem('loginTime', new Date().getTime());

          userCredential.user.getIdToken().then(function(idToken) {
            localStorage.setItem('jwtToken', idToken);
            messageContainer.innerHTML = '<p style="color: green;">Login successful!</p>';
            window.location.href = '/pages/user/dashboard.html';
            loadingIndicator.style.display = 'none'; // Hide loading indicator
          });
        })
        .catch((error) => {
          var errorMessage = error.message;
          messageContainer.innerHTML = '<p style="color: red;">Login failed: ' + errorMessage + '</p>';
          loadingIndicator.style.display = 'none'; // Hide loading indicator
        });
    } catch (error) {
        messageContainer.innerHTML = '<p style="color: red;">Login failed: ' + error.message + '</p>';
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
});
