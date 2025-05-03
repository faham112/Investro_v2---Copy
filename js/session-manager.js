firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    git add .    git commit -m "Add session management functionality"    git remote add origin https://github.com/yourusername/Investro_v22.git    const loginTime = localStorage.getItem('loginTime');
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;

    if (loginTime && now - loginTime > oneHour) {
      firebase.auth().signOut()
        .then(() => {
          localStorage.removeItem('loginTime');
          window.location.href = '/pages/login.html';
        })
        .catch((error) => {
          console.error('Error during sign-out:', error);
          alert('An error occurred while signing out. Please try again.');
        });
    }
  } else {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html')) {
      window.location.href = '/pages/login.html';
    }
  }
});
