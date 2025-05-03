firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // Optional: Check if 1 hour has passed since login
    const loginTime = localStorage.getItem('loginTime');
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;

    if (loginTime && now - loginTime > oneHour) {
      firebase.auth().signOut().then(() => {
        localStorage.removeItem('loginTime');
        window.location.href = '/pages/login.html';
      });
    }
  } else {
    // Not logged in
    window.location.href = '/pages/login.html';
  }
});
