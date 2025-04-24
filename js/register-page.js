document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
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

          // Store user data in Firebase
          firebase.database().ref('users/' + user.uid).set({
            fullName: fullName,
            email: email
          });

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
