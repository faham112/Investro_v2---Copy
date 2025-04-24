const auth = window.firebase.auth();

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var messageContainer = document.getElementById('messageContainer');

    let email = username;

    try {
        auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          var user = userCredential.user;
          // Set session information in localStorage
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', email);
          localStorage.setItem('loginTime', new Date().getTime());

          userCredential.user.getIdToken().then(function(idToken) {
            localStorage.setItem('jwtToken', idToken);
            messageContainer.innerHTML = '<p style="color: green;">Login successful!</p>';
            window.location.href = '/pages/user/dashboard.html';
          });
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
          messageContainer.innerHTML = '<p style="color: red;">Login failed: ' + errorMessage + '</p>';
        });
    } catch (error) {
        messageContainer.innerHTML = '<p style="color: red;">Login failed: ' + error.message + '</p>';
    }
});
