import { auth } from './firebase-init.js';
import { sendPasswordResetEmail } from "firebase/auth";

document.getElementById('forgetPasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var email = document.getElementById('email').value;
    var messageContainer = document.getElementById('messageContainer');
    var loadingIndicator = document.getElementById('loadingIndicator');

    loadingIndicator.style.display = 'block'; // Show loading indicator

    sendPasswordResetEmail(auth, email)
    .then(() => {
      messageContainer.innerHTML = '<p style="color: green;">Password reset email sent to ' + email + '. Please check your inbox.</p>';
      loadingIndicator.style.display = 'none'; // Hide loading indicator
    })
    .catch((error) => {
      messageContainer.innerHTML = '<p style="color: red;">Error sending password reset email: ' + error.message + '</p>';
      loadingIndicator.style.display = 'none'; // Hide loading indicator
    });
});
