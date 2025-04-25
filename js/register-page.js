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

    loadingIndicator.style.display = 'block'; // Show loading indicator

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
          // Signed in
        const user = userCredential.user;

          // Store user data in Firebase
        await firebase.database().ref('users/' + user.uid).set({
            fullName: fullName,
            email: email
        });

        messageContainer.innerHTML = '<p style="color: green;">Registration successful!</p>';
          // Optionally redirect to login page after successful registration
        window.location.href = 'login.html';
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    } catch (error) {
        messageContainer.innerHTML = '<p style="color: red;">Registration failed: ' + error.message + '</p>';
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}

document.getElementById('registerForm').addEventListener('submit', handleRegister);

export { handleRegister };
