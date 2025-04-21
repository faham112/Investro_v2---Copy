// Dashboard functionality
import { observeAuthState, logoutUser } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Observe authentication state
    observeAuthState((user) => {
        if (user) {
            // User is logged in
            initializeUI(user);
            loadDashboardData();
            initializeChart(staticData.chartData);
            setupEventListeners();
        } else {
            // User is not logged in
            window.location.href = '/pages/login.html';
        }
    });

    // Inactivity timer
    let inactivityTimer;

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutDueToInactivity, 300000); // 5 minutes (300000 ms)
    }

    function logoutDueToInactivity() {
        window.location.href = '/index.html';
    }

    // Start timer on page load
    resetInactivityTimer();

    // Reset timer on user activity
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keydown', resetInactivityTimer);
});

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard.php');
        const result = await response.json();
        
        if (result.success) {
            updateDashboardValues(result.data);
        } else {
            showNotification(result.message || 'Failed to load dashboard data', 'error');
            window.location.href = '/pages/login.html'; // Redirect to login page
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        window.location.href = '/pages/login.html'; // Redirect to login page
    }
}

// Initialize UI elements
function initializeUI(user) {
    // Set username
    const username = user.email; // Use Firebase user's email
    const usernameElements = document.querySelectorAll('.username');
    usernameElements.forEach(el => el.textContent = username);

    // Set avatar
    const avatarImg = document.getElementById('userAvatar');
    if (avatarImg) {
        // Get initials for the fallback avatar
        const initials = username.split('@')[0].substring(0, 2).toUpperCase();
        
        // Set avatar with better quality and size
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=16222A&color=d4af37&bold=true&size=160&format=svg`;
        
        // Add loading animation
        avatarImg.style.opacity = '0';
        avatarImg.onload = function() {
            avatarImg.style.transition = 'opacity 0.3s ease';
            avatarImg.style.opacity = '1';
        };
    }

    // Mobile menu toggle
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Theme initialization
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();

    // Initialize progress bars
    const investmentCards = document.querySelectorAll('.investment-card');
    investmentCards.forEach(card => {
        const progress = Math.random() * 100;
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `<div class="progress-bar-fill" style="width: ${progress}%"></div>`;
        card.appendChild(progressBar);
    });
}

// Initialize chart
function initializeChart(data) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Balance History',
                data: data.values,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0a0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0a0'
                    }
                }
            }
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.querySelector('.notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'times-circle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add loading state
function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
    } else {
        element.classList.remove('loading');
    }
}

// Update dashboard values with animation
function updateDashboardValues(data) {
    // Update balance with animation
    const balanceAmount = document.querySelector('.balance-amount');
    if (balanceAmount) {
        const startValue = parseFloat(balanceAmount.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const endValue = data.balance;
        animateValue(balanceAmount, startValue, endValue, 1000);
    }

    // Update other stats
    updateStatValue('Total Withdraw', data.totalWithdraw);
    updateStatValue('Total Deposit', data.totalDeposit);
    updateStatValue('Active Investment', data.currentInvest);
    updateStatValue('Referral Earnings', data.referralEarn);
}

// Animate value change
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const value = start + (end - start) * progress;
        element.textContent = formatCurrency(value);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Update individual stat value
function updateStatValue(title, value) {
    const statCards = document.querySelectorAll('.stat-card');
    for (const card of statCards) {
        const titleEl = card.querySelector('.stat-title');
        if (titleEl && titleEl.textContent === title) {
            const amountEl = card.querySelector('.stat-amount');
            if (amountEl) {
                amountEl.textContent = formatCurrency(value);
            }
            break;
        }
    }
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
}

// Theme toggle functionality
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-toggle i');
    const currentTheme = document.body.getAttribute('data-theme');
    
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Investment buttons
    const investButtons = document.querySelectorAll('.invest-btn');
    investButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Add your investment logic here
            alert('Investment feature coming soon!');
        });
    });

    // Quick action buttons
    const depositBtn = document.querySelector('.action-btn.deposit');
    const withdrawBtn = document.querySelector('.action-btn.withdraw');

    if (depositBtn) {
        depositBtn.addEventListener('click', showDepositModal);
    }

    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', showWithdrawModal);
    }
}

// Quick action buttons handlers
async function showDepositModal() {
    const btn = document.querySelector('.action-btn.deposit');
    setLoading(btn, true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(btn, false);
    showNotification('Deposit feature coming soon!', 'info');
}

async function showWithdrawModal() {
    const btn = document.querySelector('.action-btn.withdraw');
    setLoading(btn, true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(btn, false);
    showNotification('Withdraw feature coming soon!', 'info');
}

// Handle logout
function logout() {
    logoutUser()
        .then(() => {
            window.location.href = '/pages/login.html';
        })
        .catch((error) => {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        });
}

// Handle avatar error
function handleAvatarError(img) {
    const username = localStorage.getItem('username');
    const initials = username ? username.split('@')[0].substring(0, 2).toUpperCase() : 'U';
    
    // Create SVG fallback with initials
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#16222A"/>
        <text x="50%" y="50%" fill="#d4af37" font-family="Arial" font-weight="bold" 
              font-size="16" text-anchor="middle" dominant-baseline="central">
            ${initials}
        </text>
    </svg>`;
    
    img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
}

const staticData = {
    balance: 12345.67,
    totalWithdraw: 2150.00,
    totalDeposit: 8750.00,
    currentInvest: 5400.00,
    referralEarn: 945.00,
    chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [4200, 5100, 5800, 7200, 8900, 12345.67]
    }
};
