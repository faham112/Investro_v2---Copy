// js/register-page.js
import { registerUser } from './auth.js'; // Import the register function from auth.js

// --- Password Toggle Functionality ---
function setupPasswordToggle(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (input && icon) {
        icon.addEventListener('click', function() {
            // Toggle the type attribute
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            // Toggle the eye icon class
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    } else {
        console.warn(`Password toggle elements not found for: ${inputId} or ${iconId}`);
    }
}

setupPasswordToggle('password', 'togglePassword');
setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');


// --- Registration Form Handling ---
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const termsCheckbox = document.getElementById('terms');

        // Basic validation
        if (!fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput || !termsCheckbox) {
            console.error("Registration form elements not found.");
            alert("An error occurred loading the form. Please refresh and try again.");
            return;
        }

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const termsAccepted = termsCheckbox.checked;

        if (!fullName || !email || !password || !confirmPassword) {
            alert("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            // TODO: Add visual feedback (e.g., highlight password fields)
            return;
        }

        if (password.length < 6) {
             alert('Password should be at least 6 characters long.');
             // TODO: Add visual feedback
             return;
        }

        if (!termsAccepted) {
            alert('You must agree to the Terms of Service and Privacy Policy.');
            // TODO: Add visual feedback
            return;
        }

        console.log('Attempting Firebase registration for:', email);

        // Disable button to prevent multiple submissions
        const registerButton = registerForm.querySelector('button[type="submit"]');
        if(registerButton) registerButton.disabled = true;

        registerUser(email, password)
            .then((userCredential) => {
                // Signed in successfully (Firebase automatically signs in the user after registration)
                const user = userCredential.user;
                console.log('Firebase Registration Successful:', user.uid);
                alert('Registration successful! You are now logged in.');
                // TODO: Optionally store full name in Firestore or Realtime Database associated with user.uid
                // TODO: Redirect to a user dashboard or welcome page
                window.location.href = '../index.html'; // Redirect to home page for now
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Firebase Registration Failed:', errorCode, errorMessage);

                // Provide user-friendly error messages
                let friendlyMessage = `Registration failed. Please try again.`; // Generic default
                if (errorCode === 'auth/email-already-in-use') {
                    friendlyMessage = "This email address is already registered. Please try logging in.";
                } else if (errorCode === 'auth/invalid-email') {
                    friendlyMessage = "The email address format is invalid.";
                } else if (errorCode === 'auth/weak-password') {
                    friendlyMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
                } else if (errorCode === 'auth/network-request-failed') {
                    friendlyMessage = "Network error. Please check your internet connection.";
                }
                // Add more specific error handling as needed

                alert(friendlyMessage);
                // TODO: Display error message within the form instead of alert
            })
            .finally(() => {
                 // Re-enable button regardless of success or failure
                 if(registerButton) registerButton.disabled = false;
            });
    });
} else {
    console.warn("Registration form (registerForm) not found.");
}

console.log("Register page script loaded and listeners attached.");
