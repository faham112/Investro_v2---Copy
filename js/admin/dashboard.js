function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');

    if (!isLoggedIn || !loginTime) {
        // Not authenticated, redirect to login
        window.location.href = '../../pages/login.html';
        return false;
    }

    // Check if session has expired (1 hour = 3600000 milliseconds)
    const currentTime = new Date().getTime();
    const sessionDuration = 3600000;
    if (currentTime - loginTime > sessionDuration) {
        // Session expired, redirect to login
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
        window.location.href = '../../pages/login.html';
        return false;
    }

    return true;
}

// Check authentication on page load
window.addEventListener('load', function() {
    if (!checkAuth()) {
        return;
    }
});
