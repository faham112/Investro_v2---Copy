function checkSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const loginTime = localStorage.getItem('loginTime');
  const jwtToken = localStorage.getItem('jwtToken');

  if (isLoggedIn && loginTime && jwtToken) {
    console.log('Session Manager - isLoggedIn:', isLoggedIn);
    console.log('Session Manager - loginTime:', loginTime);
    console.log('Session Manager - jwtToken:', jwtToken);
    const now = new Date().getTime();
    const sessionDuration = now - loginTime;
    console.log('Session Manager - sessionDuration:', sessionDuration);
    console.log('Session Manager - oneHour:', 60 * 60 * 1000);
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
setInterval(checkSession, 300000); // Call checkSession every 5 minutes
