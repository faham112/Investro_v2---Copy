// Admin Panel Functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Check admin authentication
    if (!await checkAdminAuth()) {
        return;
    }

    // Initialize admin dashboard
    initializeDashboard();
    setupEventListeners();
    loadDashboardData();
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/auth.php?action=check');
        const data = await response.json();
        
        if (!data.success || data.user.role !== 'admin') {
            window.location.href = '/pages/login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/pages/login.html';
        return false;
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard.php');
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.stats);
            updateRecentActivity(data.recentActivity);
        } else {
            showNotification(data.message || 'Failed to load dashboard data', 'error');
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalInvestments').textContent = formatCurrency(stats.totalInvestments);
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('pendingWithdrawals').textContent = stats.pendingWithdrawals;
}

// Update recent activity
function updateRecentActivity(activities) {
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';

    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <p class="activity-text">${activity.description}</p>
                <span class="activity-time">${formatTime(activity.timestamp)}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Get icon for activity type
function getActivityIcon(type) {
    const icons = {
        'user': 'fa-user',
        'investment': 'fa-money-bill-wave',
        'withdrawal': 'fa-exchange-alt',
        'deposit': 'fa-arrow-down',
        'default': 'fa-info-circle'
    };
    return icons[type] || icons.default;
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Format time
function formatTime(timestamp) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
        .format(Math.round((new Date(timestamp) - new Date()) / 1000 / 60), 'minute');
}

// Show notification
function showNotification(message, type = 'info') {
    // Implementation depends on your notification system
    console.log(`${type}: ${message}`);
}

// Handle logout
async function logout() {
    try {
        const response = await fetch('/api/auth.php?action=logout');
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/pages/login.html';
        } else {
            showNotification('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout failed:', error);
        showNotification('Logout failed', 'error');
    }
}
