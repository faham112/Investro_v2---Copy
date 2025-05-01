function checkSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const loginTime = localStorage.getItem('loginTime');

  if (isLoggedIn && loginTime) {
    const now = new Date().getTime();
    const sessionDuration = now - loginTime;
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    if (sessionDuration > oneHour) {
      // Session has expired
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('jwtToken');
      window.location.href = '/pages/login.html'; // Redirect to login page
    }
  } else {
    // Not logged in
    window.location.href = '/pages/login.html'; // Redirect to login page
  }
}

checkSession(); // Call checkSession on page load
