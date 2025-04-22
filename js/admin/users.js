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
    const offset = (currentPage - 1) * USERS_PER_PAGE;
    
    fetch('../../backend/admin/users.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'list',
            search: search,
            status: status,
            kyc_status: kycStatus,
            limit: USERS_PER_PAGE,
            offset: offset
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayUsers(data.users);
            updatePagination(data.total_count);
        } else {
            showNotification(data.error || 'Failed to load users', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    });
}

function displayUsers(users) {
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" value="${user.id}"></td>
            <td>${user.id}</td>
            <td>${user.email}</td>
            <td>${user.full_name}</td>
            <td>
                <span class="status-badge ${user.status}">
                    ${capitalizeFirst(user.status)}
                </span>
            </td>
            <td>
                <span class="kyc-badge ${user.kyc_status}">
                    ${capitalizeFirst(user.kyc_status)}
                </span>
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button onclick="viewUserDetails(${user.id})" class="btn-icon">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="toggleUserStatus(${user.id}, '${user.status}')" class="btn-icon ${user.status === 'active' ? 'warning' : 'success'}">
                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewUserDetails(userId) {
    currentUserId = userId;
    
    fetch('../../backend/admin/users.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'get_details',
            user_id: userId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayUserDetails(data.user);
            displayLoginHistory(data.login_history);
            displayTransactions(data.transactions);
            document.getElementById('userDetailsModal').style.display = 'block';
        } else {
            showNotification(data.error || 'Failed to load user details', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading user details:', error);
        showNotification('Error loading user details', 'error');
    });
}

function displayUserDetails(user) {
    document.getElementById('userBasicInfo').innerHTML = `
        <div class="info-group">
            <label>Full Name:</label>
            <span>${user.full_name}</span>
        </div>
        <div class="info-group">
            <label>Email:</label>
            <span>${user.email}</span>
        </div>
        <div class="info-group">
            <label>Phone:</label>
            <span>${user.phone || 'Not provided'}</span>
        </div>
        <div class="info-group">
            <label>Country:</label>
            <span>${user.country || 'Not provided'}</span>
        </div>
        <div class="info-group">
            <label>Joined:</label>
            <span>${formatDate(user.created_at)}</span>
        </div>
    `;
    
    document.getElementById('userStats').innerHTML = `
        <div class="stat-group">
            <label>Total Deposits:</label>
            <span>$${formatNumber(user.total_deposits || 0)}</span>
        </div>
        <div class="stat-group">
            <label>Total Withdrawals:</label>
            <span>$${formatNumber(user.total_withdrawals || 0)}</span>
        </div>
        <div class="stat-group">
            <label>Transaction Count:</label>
            <span>${user.transaction_count || 0}</span>
        </div>
        <div class="stat-group">
            <label>Referrals:</label>
            <span>$${formatNumber(user.referralEarnings || 0)}</span>
        </div>
        <div class="stat-group">
            <label>Failed Logins:</label>
            <span>${user.failed_login_attempts || 0}</span>
        </div>
    `;
    
    // Update action buttons
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    toggleStatusBtn.textContent = user.status === 'active' ? 'Suspend Account' : 'Activate Account';
    toggleStatusBtn.className = `btn-${user.status === 'active' ? 'danger' : 'success'}`;
    
    const view2FABtn = document.getElementById('view2FABtn');
    view2FABtn.textContent = user.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA';
}

function displayLoginHistory(history) {
    const container = document.getElementById('loginHistory');
    container.innerHTML = '';
    
    history.forEach(login => {
        const div = document.createElement('div');
        div.className = `login-entry ${login.status}`;
        div.innerHTML = `
            <div class="login-time">
                ${formatDate(login.created_at)}
            </div>
            <div class="login-details">
                <div class="login-status">
                    <i class="fas fa-${login.status === 'success' ? 'check' : 'times'}"></i>
                    ${capitalizeFirst(login.status)}
                </div>
                <div class="login-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${login.location || 'Unknown location'}
                </div>
                <div class="login-ip">
                    <i class="fas fa-network-wired"></i>
                    ${login.ip_address}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function displayTransactions(transactions) {
    const container = document.getElementById('transactionHistory');
    container.innerHTML = '';
    
    transactions.forEach(tx => {
        const div = document.createElement('div');
        div.className = `transaction-entry ${tx.type}`;
        div.innerHTML = `
            <div class="transaction-time">
                ${formatDate(tx.created_at)}
            </div>
            <div class="transaction-details">
                <div class="transaction-type">
                    <i class="fas fa-${tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                    ${capitalizeFirst(tx.type)}
                </div>
                <div class="transaction-amount">
                    $${formatNumber(tx.amount)}
                </div>
                <div class="transaction-status">
                    <span class="status-badge ${tx.status}">
                        ${capitalizeFirst(tx.status)}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} this user?`)) {
        return;
    }
    
    fetch('../../backend/admin/users.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'update_status',
            user_id: userId,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Successfully updated ${selectedUsers.length} users`, 'success');
            loadUsers();
        } else {
            showNotification(data.error || 'Failed to update user status', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating user status:', error);
        showNotification('Error updating user status', 'error');
    });
}

function resetUserPassword() {
    if (!currentUserId) return;
    
    fetch('../../backend/admin/users.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'reset_password',
            user_id: userId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('tempPassword').textContent = data.temp_password;
            document.querySelector('.temp-password-box').classList.remove('hidden');
            document.getElementById('confirmResetBtn').style.display = 'none';
        } else {
            showNotification(data.error || 'Failed to reset password', 'error');
        }
    })
    .catch(error => {
        console.error('Error resetting password:', error);
        showNotification('Error resetting password', 'error');
    });
}

function initializeModals() {
    // User Details Modal
    const userModal = document.getElementById('userDetailsModal');
    const passwordModal = document.getElementById('passwordResetModal');
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = function() {
            userModal.style.display = 'none';
            passwordModal.style.display = 'none';
        };
    });
    
    document.getElementById('resetPasswordBtn').onclick = function() {
        passwordModal.style.display = 'block';
    };
    
    document.getElementById('confirmResetBtn').onclick = resetUserPassword;
    
    document.getElementById('copyPassword').onclick = function() {
        const tempPassword = document.getElementById('tempPassword').textContent;
        navigator.clipboard.writeText(tempPassword)
            .then(() => showNotification('Password copied to clipboard', 'success'))
            .catch(() => showNotification('Failed to copy password', 'error'));
    };
    
    window.onclick = function(event) {
        if (event.target === userModal) {
            userModal.style.display = 'none';
        }
        if (event.target === passwordModal) {
            passwordModal.style.display = 'none';
        }
    };
}

function initializeTabSystem() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            
            btn.classList.add('active');
            document.getElementById(tab + 'History').classList.remove('hidden');
            
            if (tab === 'transactions') {
                loadTransactions();
            } else if (tab === 'withdrawals') {
                loadWithdrawals();
            }
        });
    });
}

function updatePagination(totalCount) {
    const totalPages = Math.ceil(totalCount / 20);
    const pagination = document.getElementById('usersPagination');
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<button onclick="changePage(${currentPage - 1})" class="page-btn">&laquo; Previous</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            html += `<button onclick="changePage(${i})" class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span class="page-ellipsis">...</span>';
        }
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="changePage(${currentPage + 1})" class="page-btn">Next &raquo;</button>`;
    }
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadUsers();
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
    if (show) {
        loader.style.display = 'flex' : 'none';
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
    const offset = (currentPage -
