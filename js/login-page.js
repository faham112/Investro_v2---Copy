// js/login-page.js
import { loginUser } from './auth.js'; // Import the login function from auth.js
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import app from './firebase-init.js';

const auth = getAuth(app);

// --- Password Toggle Functionality ---
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle the eye icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
} else {
    console.warn("Password toggle elements (togglePassword or password input) not found.");
}

// --- Login Form Handling ---
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password'); // Re-get in case it wasn't found before
        const rememberCheckbox = document.getElementById('remember');

        // Basic validation
        if (!emailInput || !passwordInput || !rememberCheckbox) {
            console.error("Login form elements (email, password, or remember checkbox) not found.");
            alert("An error occurred loading the form. Please refresh and try again.");
            return;
        }
        if (!emailInput.value || !passwordInput.value) {
             alert("Please enter both email and password.");
             return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked; // We get the value, but Firebase handles persistence separately

        console.log('Attempting Firebase login for:', email); // Don't log password

        // Disable button to prevent multiple submissions
        const loginButton = loginForm.querySelector('button[type="submit"]');
        if(loginButton) loginButton.disabled = true;

        // Set session persistence based on "remember me" checkbox
        setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
            .then(() => {
                // Existing sign-in logic
                return loginUser(email, password);
            })
            .then((userCredential) => {
                // Signed in successfully
                const user = userCredential.user;
                console.log('Firebase Login Successful:', user.uid);
                alert('Login successful!');
                localStorage.setItem('loginSuccess', 'true');
                // TODO: Redirect based on user role or to a default logged-in page
                window.location.href = '/pages/user/dashboard.html'; // Redirect to user dashboard
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Firebase Login Failed:', errorCode, errorMessage);

                // Provide user-friendly error messages
                let friendlyMessage = `Login failed. Please try again.`; // Generic default
                if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                    friendlyMessage = "Invalid email or password. Please check your credentials.";
                } else if (errorCode === 'auth/invalid-email') {
                    friendlyMessage = "The email address format is invalid.";
                } else if (errorCode === 'auth/too-many-requests') {
                    friendlyMessage = "Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.";
                } else if (errorCode === 'auth/network-request-failed') {
                    friendlyMessage = "Network error. Please check your internet connection.";
                }
                // Add more specific error handling as needed

                alert(friendlyMessage);
                // TODO: Display error message within the form instead of alert
            })
            .finally(() => {
                 // Re-enable button regardless of success or failure
                 if(loginButton) loginButton.disabled = false;
            });

        // Note: Firebase handles session persistence based on settings (local, session, none).
        // The 'remember me' checkbox might influence which persistence type you set via Firebase config or setPersistence().
        // See Firebase docs: https://firebase.google.com/docs/auth/web/auth-state-persistence
    });
} else {
    console.warn("Login form (loginForm) not found.");
}

console.log("Login page script loaded and listeners attached.");
