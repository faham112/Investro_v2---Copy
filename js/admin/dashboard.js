import { observeAuthState } from '../auth.js';

// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Observe authentication state
    observeAuthState((user) => {
        if (user && user.email === 'admin@example.com') { // Replace with your admin email
            // Admin is logged in
            loadDashboardData();
            initializeNotifications();
            initializeTabs();

            // Display welcome message with current date and time
            displayWelcomeMessage();
            
            // Set up real-time updates
            setupWebSocket();
            
            // Refresh data periodically
            setInterval(loadDashboardData, 60000); // Every minute
            setInterval(checkNotifications, 30000); // Every 30 seconds
        } else {
            // Admin is not logged in
            window.location.href = '../pages/admin/login.html';
        }
    });
});

function displayWelcomeMessage() {
    const welcomeMessageDiv = document.getElementById('welcome-message');
    if (welcomeMessageDiv) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
        const dateTimeString = now.toLocaleDateString('en-US', options);
        welcomeMessageDiv.textContent = `Today is ${dateTimeString}`;
    }
}

// Load all dashboard data
async function loadDashboardData() {
    showLoading(true);
    
    try {
        const response = await fetch('/Backend/api/admin/dashboard_stats.php');
        const data = await response.json();
        
        if (data.success) {
            updateStats(data.data.stats);
            updateActivityLog(data.data.activity);
            updatePendingActions(data.data.pending);
        } else {
            showNotification('error', data.error || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('error', 'Failed to load dashboard data');
    } finally {
        showLoading(false);
    }
}

// Update dashboard statistics
function updateStats(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalInvestments').textContent = formatCurrency(stats.totalInvestments);
    document.getElementById('pendingWithdrawals').textContent = stats.pendingWithdrawals;
    document.getElementById('totalDeposits').textContent = formatCurrency(stats.totalDeposits);
}

// Update activity log
function updateActivityLog(activities) {
    const activityContainer = document.getElementById('activityLog');
    if (!activityContainer) return;

    activityContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-header">
                    <span class="activity-user">${activity.user}</span>
                    <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
                </div>
                <div class="activity-description">
                    ${activity.type} - ${formatCurrency(activity.amount)}
                    <span class="status-badge ${activity.status}">${activity.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update pending actions
function updatePendingActions(actions) {
    const pendingContainer = document.getElementById('pendingActions');
    if (!pendingContainer) return;

    pendingContainer.innerHTML = actions.map(action => `
        <div class="pending-item">
            <div class="pending-header">
                <span class="pending-user">${action.user}</span>
                <span class="pending-amount">${formatCurrency(action.amount)}</span>
            </div>
            <div class="pending-actions">
                <button class="btn-approve" onclick="approveAction(${action.id})">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="rejectAction(${action.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

// Load financial statistics
async function loadFinancialStats() {
    try {
        const response = await fetch('../../api/admin/financial-stats.php');
        
        if (!response.ok) throw new Error('Failed to fetch financial stats');
        
        const stats = await response.json();
        
        // Update total earnings
        document.getElementById('totalEarnings').textContent = formatCurrency(stats.totalEarnings);
        document.getElementById('earningsChange').innerHTML = formatChange(stats.earningsChange);
        
        // Update active investments
        document.getElementById('activeInvestments').textContent = stats.activeInvestments;
        document.getElementById('investmentsChange').innerHTML = formatChange(stats.investmentsChange);
        
        // Update pending withdrawals
        document.getElementById('pendingWithdrawals').textContent = formatCurrency(stats.pendingWithdrawalsAmount);
        document.getElementById('pendingWithdrawalsCount').textContent = `${stats.pendingWithdrawalsCount} requests`;
    } catch (error) {
        console.error('Error loading financial stats:', error);
        showNotification('error', 'Failed to load financial statistics');
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const response = await fetch('../../api/admin/user-stats.php');
        
        if (!response.ok) throw new Error('Failed to fetch user stats');
        
        const stats = await response.json();
        
        // Update user counts
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('usersChange').innerHTML = formatChange(stats.usersChange);
        
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('activeUsersPercentage').textContent = 
            Math.round((stats.activeUsers / stats.totalUsers) * 100) + '%';
        
        // Update KYC stats
        document.getElementById('kycPending').textContent = stats.kycPending;
        document.getElementById('kycPendingCount').textContent = `${stats.kycPending} requests`;
    } catch (error) {
        console.error('Error loading user stats:', error);
        showNotification('error', 'Failed to load user statistics');
    }
}

// Load security statistics
async function loadSecurityStats() {
    try {
        const response = await fetch('../../api/admin/security-stats.php');
        
        if (!response.ok) throw new Error('Failed to fetch security stats');
        
        const stats = await response.json();
        
        // Update security metrics
        document.getElementById('failedLogins').textContent = stats.failedLogins;
        document.getElementById('suspiciousActivities').textContent = stats.suspiciousActivities;
        
        // Update system health
        document.getElementById('systemHealth').textContent = stats.systemHealth + '%';
        document.getElementById('systemStatus').textContent = stats.systemStatus;
        
        // Update status color based on health
        const healthElement = document.getElementById('systemHealth');
        if (stats.systemHealth >= 90) {
            healthElement.className = 'stat-value text-success';
        } else if (stats.systemHealth >= 70) {
            healthElement.className = 'stat-value text-warning';
        } else {
            healthElement.className = 'stat-value text-danger';
        }
    } catch (error) {
        console.error('Error loading security stats:', error);
        showNotification('error', 'Failed to load security statistics');
    }
}

// Load activity log
async function loadActivityLog(filter = 'all') {
    try {
        const response = await fetch(`../../api/admin/activity-log.php?filter=${filter}`);
        
        if (!response.ok) throw new Error('Failed to fetch activity log');
        
        const activities = await response.json();
        const activityList = document.getElementById('activityList');
        
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-title">${activity.title}</span>
                        <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    <p class="activity-description">${activity.description}</p>
                    ${activity.amount ? `<span class="activity-amount">${formatCurrency(activity.amount)}</span>` : ''}
                </div>
            `;
            activityList.appendChild(activityElement);
        });
    } catch (error) {
        console.error('Error loading activity log:', error);
        showNotification('error', 'Failed to load activity log');
    }
}

// Load pending actions
async function loadPendingActions(tab = 'withdrawals') {
    try {
        const response = await fetch(`../../api/admin/pending-actions.php?type=${tab}`);
        
        if (!response.ok) throw new Error('Failed to fetch pending actions');
        
        const actions = await response.json();
        const container = document.getElementById(`${tab}Tab`);
        container.innerHTML = ''; // Clear existing content
        
        if (actions.length === 0) {
            container.innerHTML = '<p class="no-data">No pending actions</p>';
            return;
        }
        
        actions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = 'pending-action-item';
            
            switch (tab) {
                case 'withdrawals':
                    actionElement.innerHTML = createWithdrawalActionHTML(action);
                    break;
                case 'kyc':
                    actionElement.innerHTML = createKYCActionHTML(action);
                    break;
                case 'support':
                    actionElement.innerHTML = createSupportActionHTML(action);
                    break;
            }
            
            container.appendChild(actionElement);
        });
    } catch (error) {
        console.error('Error loading pending actions:', error);
        showNotification('error', 'Failed to load pending actions');
    }
}

// Initialize WebSocket connection for real-time updates
function setupWebSocket() {
    const ws = new WebSocket('wss://your-websocket-server.com');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'new_withdrawal':
                updatePendingWithdrawals(data);
                break;
            case 'new_kyc':
                updateKYCRequests(data);
                break;
            case 'new_ticket':
                updateSupportTickets(data);
                break;
            case 'security_alert':
                handleSecurityAlert(data);
                break;
        }
    };
    
    ws.onclose = function() {
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
    };
}

// Initialize notification system
function initializeNotifications() {
    // Set up notification click handlers
    document.querySelector('.notification-center').addEventListener('click', function(e) {
        if (e.target.closest('.btn-icon')) {
            toggleNotifications();
        }
    });
    
    // Load initial notifications
    loadNotifications();
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch('../../api/admin/notifications.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const notifications = await response.json();
        updateNotificationBadge(notifications.unread);
        
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = '';
        
        notifications.items.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification-item ${notification.read ? '' : 'unread'}`;
            notificationElement.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
                </div>
                ${!notification.read ? '<button class="mark-read" onclick="markAsRead(' + notification.id + ')">Mark as read</button>' : ''}
            `;
            notificationList.appendChild(notificationElement);
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Initialize tab system
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                activeTab.classList.remove('active');
            }
            
            tab.classList.add('active');
            
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            document.getElementById(`${tabName}Tab`).classList.remove('hidden');
            loadPendingActions(tabName);
        });
    });
}

// Enhanced Statistics Functions
async function loadExtendedStats() {
    try {
        const response = await fetch('../../api/admin/extended-stats.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch extended stats');
        
        const stats = await response.json();
        
        // Update UI with extended stats
        document.getElementById('adminEarnings').textContent = formatCurrency(stats.adminEarnings);
        document.getElementById('pendingWithdrawals').textContent = formatCurrency(stats.pendingWithdrawals);
        document.getElementById('activePlansCount').textContent = stats.activePlansCount;
        
        // Update last login info
        const lastLogin = new Date(stats.lastLogin);
        document.getElementById('lastLoginInfo').textContent = formatDateTime(lastLogin);
        document.getElementById('lastLoginLocation').textContent = `Location: ${stats.lastLoginLocation}`;
    } catch (error) {
        console.error('Error loading extended stats:', error);
        showNotification('error', 'Failed to load extended statistics');
    }
}

// Security & Logs Functions
async function loadAdminLogs() {
    try {
        const response = await fetch('../../api/admin/activity-logs.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch admin logs');
        
        const logs = await response.json();
        const logsBody = document.getElementById('adminLogsBody');
        logsBody.innerHTML = '';
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(new Date(log.timestamp))}</td>
                <td>${log.adminName}</td>
                <td>${log.action}</td>
                <td>${log.details}</td>
                <td>${log.ipAddress}</td>
            `;
            logsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading admin logs:', error);
        showNotification('error', 'Failed to load admin activity logs');
    }
}

async function loadUserLogs() {
    try {
        const response = await fetch('../../api/admin/user-login-logs.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user logs');
        
        const logs = await response.json();
        const logsBody = document.getElementById('userLogsBody');
        logsBody.innerHTML = '';
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(new Date(log.timestamp))}</td>
                <td>${log.username}</td>
                <td><span class="badge badge-${log.status === 'success' ? 'success' : 'danger'}">${log.status}</span></td>
                <td>${log.ipAddress}</td>
                <td>${log.location}</td>
            `;
            logsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading user logs:', error);
        showNotification('error', 'Failed to load user login logs');
    }
}

async function loadSecurityLogs() {
    try {
        const response = await fetch('../../api/admin/security-logs.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch security logs');
        
        const logs = await response.json();
        const logsBody = document.getElementById('securityLogsBody');
        logsBody.innerHTML = '';
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(new Date(log.timestamp))}</td>
                <td>${log.type}</td>
                <td>${log.description}</td>
                <td>${log.ipAddress}</td>
                <td>
                    <button onclick="handleSecurityAlert(${log.id})" class="btn-icon" title="Handle Alert">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                </td>
            `;
            logsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading security logs:', error);
        showNotification('error', 'Failed to load security alerts');
    }
}

function switchLogTab(tab) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchLogTab('${tab}')"]`).classList.add('active');
    
    // Update active tab content
    document.querySelectorAll('.log-table').forEach(table => {
        table.classList.remove('active');
    });
    document.getElementById(`${tab}Logs`).classList.add('active');
    
    // Load corresponding data
    switch(tab) {
        case 'admin':
            loadAdminLogs();
            break;
        case 'user':
            loadUserLogs();
            break;
        case 'security':
            loadSecurityLogs();
            break;
    }
}

async function exportLogs() {
    const activeTab = document.querySelector('.tab-btn.active').textContent.toLowerCase();
    window.location.href = `../../api/admin/export-logs.php?type=${activeTab}&token=${localStorage.getItem('adminToken')}`;
}

// Real-time Notifications
let notificationSocket;

function initializeWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/admin-notifications`;
    
    notificationSocket = new WebSocket(wsUrl);
    
    notificationSocket.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        addNotification(notification);
        updateNotificationBadge();
    };
    
    notificationSocket.onclose = () => {
        setTimeout(initializeWebSocket, 5000); // Reconnect after 5 seconds
    };
}

function addNotification(notification) {
    const notificationsList = document.getElementById('notificationsList');
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`;
    notificationElement.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${formatTimeAgo(new Date(notification.timestamp))}</span>
            </div>
            <p class="notification-message">${notification.message}</p>
            <div class="notification-actions">
                <button onclick="handleNotification(${notification.id})" class="btn-link">
                    View Details
                </button>
                <button onclick="markNotificationRead(${notification.id})" class="btn-link">
                    Mark as Read
                </button>
            </div>
        </div>
    `;
    
    notificationsList.insertBefore(notificationElement, notificationsList.firstChild);
}

function getNotificationIcon(type) {
    const icons = {
        'deposits': 'fa-money-bill-wave',
        'withdrawals': 'fa-money-bill-transfer',
        'kyc': 'fa-id-card',
        'support': 'fa-headset',
        'security': 'fa-shield-alt'
    };
    return icons[type] || 'fa-bell';
}

async function markAllRead() {
    try {
        const response = await fetch('../../api/admin/mark-all-notifications-read.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to mark notifications as read');
        
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
        });
        
        updateNotificationBadge();
        showNotification('success', 'All notifications marked as read');
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        showNotification('error', 'Failed to mark notifications as read');
    }
}

function filterNotifications(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${type}"]`).classList.add('active');
    
    const notifications = document.querySelectorAll('.notification-item');
    notifications.forEach(notification => {
        if (type === 'all' || notification.classList.contains(type)) {
            notification.style.display = 'flex';
        } else {
            notification.style.display = 'none';
        }
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function getActivityIcon(type) {
    const icons = {
        deposit: 'fa-money-bill-wave',
        withdrawal: 'fa-money-bill-transfer',
        investment: 'fa-chart-line',
        kyc: 'fa-id-card',
        admin: 'fa-user-shield',
        security: 'fa-shield-alt'
    };
    return icons[type] || 'fa-circle-info';
}

function getNotificationIcon(type) {
    const icons = {
        withdrawal: 'fa-money-bill-transfer',
        kyc: 'fa-id-card',
        security: 'fa-shield-alt',
        support: 'fa-headset',
        system: 'fa-server'
    };
    return icons[type] || 'fa-bell';
}

function formatChange(value) {
    if (value > 0) {
        return `<span class="text-success">+${value}%</span>`;
    } else if (value < 0) {
        return `<span class="text-danger">${value}%</span>`;
    }
    return `<span class="text-muted">${value}%</span>`;
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    notification.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Create HTML for pending actions
function createWithdrawalActionHTML(withdrawal) {
    return `
        <div class="action-header">
            <h4>Withdrawal Request #${withdrawal.id}</h4>
            <span class="amount">${formatCurrency(withdrawal.amount)}</span>
        </div>
        <div class="action-details">
            <p><strong>User:</strong> ${withdrawal.username}</p>
            <p><strong>Method:</strong> ${withdrawal.method}</p>
            <p><strong>Requested:</strong> ${formatTimeAgo(withdrawal.timestamp)}</p>
        </div>
        <div class="action-buttons">
            <button onclick="approveWithdrawal(${withdrawal.id})" class="btn-success">Approve</button>
            <button onclick="rejectWithdrawal(${withdrawal.id})" class="btn-danger">Reject</button>
            <button onclick="viewWithdrawalDetails(${withdrawal.id})" class="btn-secondary">Details</button>
        </div>
    `;
}

function createKYCActionHTML(kyc) {
    return `
        <div class="action-header">
            <h4>KYC Verification</h4>
            <span class="badge badge-warning">Pending</span>
        </div>
        <div class="action-details">
            <p><strong>User:</strong> ${kyc.username}</p>
            <p><strong>Document Type:</strong> ${kyc.documentType}</p>
            <p><strong>Submitted:</strong> ${formatTimeAgo(kyc.timestamp)}</p>
        </div>
        <div class="action-buttons">
            <button onclick="approveKYC(${kyc.id})" class="btn-success">Approve</button>
            <button onclick="rejectKYC(${kyc.id})" class="btn-danger">Reject</button>
            <button onclick="viewKYCDetails(${kyc.id})" class="btn-secondary">View Documents</button>
        </div>
    `;
}

function createSupportActionHTML(ticket) {
    return `
        <div class="action-header">
            <h4>${ticket.subject}</h4>
            <span class="badge badge-${ticket.priority}">${ticket.priority}</span>
        </div>
        <div class="action-details">
            <p><strong>User:</strong> ${ticket.username}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Opened:</strong> ${formatTimeAgo(ticket.timestamp)}</p>
        </div>
        <div class="action-buttons">
            <button onclick="viewTicket(${ticket.id})" class="btn-primary">View Ticket</button>
            <button onclick="assignTicket(${ticket.id})" class="btn-secondary">Assign</button>
        </div>
    `;
}

// Utility Functions
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadExtendedStats();
    switchLogTab('admin');
    initializeWebSocket();
    
    // Set up notification filter listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterNotifications(btn.dataset.filter));
    });
    
    // Auto-refresh data
    setInterval(loadExtendedStats, 60000); // Refresh stats every minute
});
