// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserStats();
    loadUsers();
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '../login.html';
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const response = await fetch('../../api/admin/user-stats.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user stats');
        
        const stats = await response.json();
        
        // Update user overview stats
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('bannedUsers').textContent = stats.bannedUsers;
        
        // Update KYC stats
        document.getElementById('verifiedUsers').textContent = stats.verifiedUsers;
        document.getElementById('pendingKyc').textContent = stats.pendingKyc;
        document.getElementById('rejectedKyc').textContent = stats.rejectedKyc;
        
        // Update investment stats
        document.getElementById('activeInvestors').textContent = stats.activeInvestors;
        document.getElementById('totalInvested').textContent = formatCurrency(stats.totalInvested);
        document.getElementById('avgInvestment').textContent = formatCurrency(stats.avgInvestment);
        
        // Update referral stats
        document.getElementById('totalReferrers').textContent = stats.totalReferrers;
        document.getElementById('totalReferred').textContent = stats.totalReferred;
        document.getElementById('commissionPaid').textContent = formatCurrency(stats.commissionPaid);
    } catch (error) {
        console.error('Error loading user stats:', error);
        showNotification('error', 'Failed to load user statistics');
    }
}

// Load users list
async function loadUsers() {
    try {
        const searchQuery = document.getElementById('searchUser').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const kycFilter = document.getElementById('kycFilter').value;
        
        const response = await fetch(`../../api/admin/users.php?search=${searchQuery}&status=${statusFilter}&kyc=${kycFilter}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || '../../assets/default-avatar.png'}" alt="Avatar" class="user-avatar">
                        <div>
                            <strong>${user.username}</strong>
                            <small>ID: ${user.id}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${formatCurrency(user.balance)}</td>
                <td>${user.totalInvestments} investments</td>
                <td><span class="badge badge-${getKycStatusClass(user.kycStatus)}">${user.kycStatus}</span></td>
                <td><span class="badge badge-${getStatusClass(user.status)}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewUser(${user.id})" class="btn-icon" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editUser(${user.id})" class="btn-icon" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.status === 'banned' ? 
                            `<button onclick="unbanUser(${user.id})" class="btn-icon" title="Unban User">
                                <i class="fas fa-user-check"></i>
                            </button>` :
                            `<button onclick="banUser(${user.id})" class="btn-icon" title="Ban User">
                                <i class="fas fa-user-slash"></i>
                            </button>`
                        }
                    </div>
                </td>
            `;
            usersList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('error', 'Failed to load users');
    }
}

// View user details
async function viewUser(userId) {
    try {
        const response = await fetch(`../../api/admin/user-details.php?id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user details');
        
        const user = await response.json();
        const modal = document.getElementById('userModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="user-details">
                <div class="user-header">
                    <img src="${user.avatar || '../../assets/default-avatar.png'}" alt="Avatar" class="large-avatar">
                    <h3>${user.username}</h3>
                    <p>${user.email}</p>
                </div>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="label">Account Balance</span>
                        <span class="value">${formatCurrency(user.balance)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Total Invested</span>
                        <span class="value">${formatCurrency(user.totalInvested)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Referral Earnings</span>
                        <span class="value">${formatCurrency(user.referralEarnings)}</span>
                    </div>
                </div>
                <div class="details-section">
                    <h4>KYC Information</h4>
                    <div class="kyc-details">
                        <p><strong>Status:</strong> <span class="badge badge-${getKycStatusClass(user.kycStatus)}">${user.kycStatus}</span></p>
                        <p><strong>Submitted:</strong> ${formatDate(user.kycSubmitted)}</p>
                        <p><strong>Verified:</strong> ${user.kycVerified ? formatDate(user.kycVerified) : 'Not verified'}</p>
                    </div>
                </div>
                <div class="details-section">
                    <h4>Account Information</h4>
                    <p><strong>Registered:</strong> ${formatDate(user.registeredDate)}</p>
                    <p><strong>Last Login:</strong> ${formatDate(user.lastLogin)}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${getStatusClass(user.status)}">${user.status}</span></p>
                    <p><strong>2FA Enabled:</strong> ${user.twoFactorEnabled ? 'Yes' : 'No'}</p>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing user details:', error);
        showNotification('error', 'Failed to load user details');
    }
}

// Ban user
async function banUser(userId) {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    try {
        const response = await fetch('../../api/admin/ban-user.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ userId })
        });
        
        if (!response.ok) throw new Error('Failed to ban user');
        
        showNotification('success', 'User has been banned');
        loadUsers();
        loadUserStats();
    } catch (error) {
        console.error('Error banning user:', error);
        showNotification('error', 'Failed to ban user');
    }
}

// Unban user
async function unbanUser(userId) {
    if (!confirm('Are you sure you want to unban this user?')) return;
    
    try {
        const response = await fetch('../../api/admin/unban-user.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ userId })
        });
        
        if (!response.ok) throw new Error('Failed to unban user');
        
        showNotification('success', 'User has been unbanned');
        loadUsers();
        loadUserStats();
    } catch (error) {
        console.error('Error unbanning user:', error);
        showNotification('error', 'Failed to unban user');
    }
}

// Export users
function exportUsers() {
    const searchQuery = document.getElementById('searchUser').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const kycFilter = document.getElementById('kycFilter').value;
    
    window.location.href = `../../api/admin/export-users.php?search=${searchQuery}&status=${statusFilter}&kyc=${kycFilter}&token=${localStorage.getItem('adminToken')}`;
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function getStatusClass(status) {
    const statusClasses = {
        'active': 'success',
        'inactive': 'warning',
        'banned': 'danger'
    };
    return statusClasses[status] || 'default';
}

function getKycStatusClass(status) {
    const statusClasses = {
        'verified': 'success',
        'pending': 'warning',
        'rejected': 'danger'
    };
    return statusClasses[status] || 'default';
}

// Event listeners
document.getElementById('searchUser').addEventListener('input', debounce(loadUsers, 300));
document.getElementById('statusFilter').addEventListener('change', loadUsers);
document.getElementById('kycFilter').addEventListener('change', loadUsers);

// Close modal when clicking outside or on close button
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('userModal').style.display = 'none';
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Helper function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Show/hide loading indicator
function showLoading(show) {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    } else {
        loader.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function displayWithdrawals(withdrawals) {
    const container = document.getElementById('withdrawalHistory');
    container.innerHTML = '';
    
    withdrawals.forEach(withdrawal => {
        const div = document.createElement('div');
        div.className = `withdrawal-entry ${withdrawal.status}`;
        div.innerHTML = `
            <div class="withdrawal-time">
                ${formatDate(withdrawal.created_at)}
            </div>
            <div class="withdrawal-details">
                <div class="withdrawal-amount">
                    $${formatNumber(withdrawal.amount)}
                </div>
                <div class="withdrawal-status">
                    <span class="status-badge ${withdrawal.status}">
                        ${capitalizeFirst(withdrawal.status)}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatNumber(number) {
    return parseFloat(number).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Implement your notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.style.display = 'block';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

function formatChange(value) {
    if (value > 0) {
        return `<span class="text-success">+${formatNumber(value)}%</span>`;
    } else if (value < 0) {
        return `<span class="text-danger">${formatNumber(value)}%</span>`;
    } else {
        return `<span class="text-muted">${formatNumber(value)}%</span>`;
    }
}

let currentUserId = null;
const USERS_PER_PAGE = 20;
let currentPage = 1;

function initializeFilters() {
    document.getElementById('userSearch').addEventListener('input', debounce(loadUsers, 500));
    document.getElementById('statusFilter').addEventListener('change', loadUsers);
    document.getElementById('kycFilter').addEventListener('change', loadUsers);
}

function loadUsers() {
    const search = document.getElementById('userSearch').value;
    const status = document.getElementById('statusFilter').value;
    const kycStatus = document.getElementById('kycFilter').value;
    const offset = (currentPage - 1)

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.



New problems detected after saving the file:
js/admin/users.js
- [ts Error] Line 972: Unterminated string literal.
- [ts Error] Line 972: '}' expected.
- [ts Error] Line 406: Cannot redeclare block-scoped variable 'currentUserId'.
- [ts Error] Line 407: Cannot redeclare block-scoped variable 'USERS_PER_PAGE'.
- [ts Error] Line 408: Cannot redeclare block-scoped variable 'currentPage'.
- [ts Error] Line 955: Cannot redeclare block-scoped variable 'currentUserId'.
- [ts Error] Line 956: Cannot redeclare block-scoped variable 'USERS_PER_PAGE'.
- [ts Error] Line 957: Cannot redeclare block-scoped variable 'currentPage'.<environment_details>
# VSCode Visible Files
pages/user/settings.html

# VSCode Open Tabs
pages/admin/dashboard.html
pages/user/profile.html
pages/user/settings.html
js/admin/users.js

# Recently Modified Files
These files have been modified since you last accessed them (file was just edited so you may need to re-read it before editing):
js/admin/users.js

# Current Time
4/22/2025, 3:22:27 PM (Asia/Karachi, UTC+5:00)

# Context Window Usage
996,706 / 1,048.576K tokens used (95%)

# Current Mode
ACT MODE
</environment_details>
