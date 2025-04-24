// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_RFY98xrBfLpYz3c_zw-fJc6pieGcA88",
  authDomain: "webappfinal112.firebaseapp.com",
  projectId: "webappfinal112",
  storageBucket: "webappfinal112.firebasestorage.app",
  messagingSenderId: "82896269063",
  appId: "1:82896269063:web:37ecddbe1ab34407675fa2",
  measurementId: "G-XV090SK0VK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var messageContainer = document.getElementById('messageContainer');

    let email = username;
    if (!isValidEmail(username)) {
        // Assume it's a userId and fetch email from Firebase (not implemented)
        // In a real application, you would fetch the email from Firebase using the userId
        // For now, we'll just assume the userId is the email
        console.log("Assuming userId is the email");
    }

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
