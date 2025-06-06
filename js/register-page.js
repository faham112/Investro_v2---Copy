async function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageContainer = document.getElementById('messageContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

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

    const registerButton = document.querySelector('.register-button');
    registerButton.disabled = true; // Disable the button

    loadingIndicator.style.display = 'block'; // Show loading indicator

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
          // Signed in
        const user = userCredential.user;

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', email);
        localStorage.setItem('loginTime', new Date().getTime());

        //console.log("User data saved to database successfully!"); // ADDED LOG
        //console.log("About to hide loading indicator and redirect"); // ADDED LOG

        //messageContainer.innerHTML = '<p style="color: green;">Registration successful!</p>';
        //loadingIndicator.style.display = 'none'; // Hide loading indicator
          // Optionally redirect to login page after successful registration
        window.location.replace('/pages/user/dashboard.html');
    } catch (error) {
        // Log the specific error to the console for debugging
     console.error("Registration Error:", error);

        let errorMessage = "Registration failed. Please check your details and try again.";

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "User email already exists.";
             messageContainer.innerHTML = '<p style="color: red;">' + errorMessage + '</p>';
        } else {
             messageContainer.innerHTML = '<p style="color: red;">' + errorMessage + '</p>';
        }

        // Display a generic message to the user
       
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}

document.getElementById('registerForm').addEventListener('submit', handleRegister);
