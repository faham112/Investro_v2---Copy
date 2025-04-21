// Global variables
let currentPage = 1;
let totalPages = 1;
let transactions = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadTransactions();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize filters
    initializeFilters();
    
    loadPendingWithdrawals();
    loadRejectedTransactions();
});

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('transactionSearch');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Filters
    document.getElementById('transactionType').addEventListener('change', loadTransactions);
    document.getElementById('transactionStatus').addEventListener('change', loadTransactions);
    document.getElementById('dateRange').addEventListener('change', loadTransactions);
    
    // Refresh button
    document.getElementById('refreshTransactions').addEventListener('click', loadTransactions);
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    
    // Modal close button
    document.querySelector('.close-btn').addEventListener('click', closeTransactionModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.getElementsByClassName('modal');
        Array.from(modals).forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Initialize date filters with last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
    
    // Load initial data
    filterTransactions();
}

function loadTransactions() {
    showLoading(true);
    
    // Get filter values
    const type = document.getElementById('transactionType').value;
    const status = document.getElementById('transactionStatus').value;
    const dateRange = document.getElementById('dateRange').value;
    
    // Make API call
    fetch('../../backend/admin/transactions.php', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            transactions = data.transactions;
            updateTransactionTable(transactions);
            updateSummary(transactions);
        } else {
            showNotification(data.error || 'Failed to load transactions', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

function updateTransactionTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${transaction.id}</td>
            <td>
                <div class="user-cell">
                    <span class="user-name">${transaction.user_name}</span>
                    <span class="user-email">${transaction.user_email}</span>
                </div>
            </td>
            <td>
                <span class="transaction-type ${transaction.type.toLowerCase()}">
                    ${capitalizeFirst(transaction.type)}
                </span>
            </td>
            <td>
                <span class="amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(transaction.amount)}
                </span>
            </td>
            <td>${formatDate(transaction.date)}</td>
            <td>
                <span class="status-badge status-${transaction.status.toLowerCase()}">
                    ${capitalizeFirst(transaction.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewTransaction(${transaction.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${transaction.status === 'pending' ? `
                        <button class="btn-icon success" onclick="approveTransaction(${transaction.id})" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon danger" onclick="rejectTransaction(${transaction.id})" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function updateSummary(transactions) {
    // Update total transactions
    document.getElementById('totalTransactions').textContent = transactions.length;
    
    // Update pending approvals
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    document.getElementById('pendingApprovals').textContent = pendingCount;
    
    // Update total amount
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
}

function viewTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    // Populate modal
    document.getElementById('modalTransactionId').textContent = transaction.id;
    document.getElementById('modalUser').textContent = `${transaction.user_name} (${transaction.user_email})`;
    document.getElementById('modalType').textContent = capitalizeFirst(transaction.type);
    document.getElementById('modalAmount').textContent = formatCurrency(transaction.amount);
    document.getElementById('modalStatus').textContent = capitalizeFirst(transaction.status);
    document.getElementById('modalDate').textContent = formatDate(transaction.date);
    document.getElementById('modalDescription').textContent = transaction.description || 'No description available';
    
    // Update action buttons
    const actionsContainer = document.getElementById('modalActions');
    if (transaction.status === 'pending') {
        actionsContainer.innerHTML = `
            <button class="btn-success" onclick="approveTransaction(${transaction.id})">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-danger" onclick="rejectTransaction(${transaction.id})">
                <i class="fas fa-times"></i> Reject
            </button>
        `;
    } else {
        actionsContainer.innerHTML = '';
    }
    
    // Show modal
    document.getElementById('transactionModal').style.display = 'block';
}

function closeTransactionModal() {
    document.getElementById('transactionModal').style.display = 'none';
}

function approveTransaction(transactionId) {
    if (!confirm('Are you sure you want to approve this transaction?')) return;
    
    updateTransactionStatus(transactionId, 'approved');
}

function rejectTransaction(transactionId) {
    if (!confirm('Are you sure you want to reject this transaction?')) return;
    
    updateTransactionStatus(transactionId, 'rejected');
}

function updateTransactionStatus(transactionId, status) {
    showLoading(true);
    
    fetch('../../backend/admin/transactions.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'update_status',
            transaction_id: transactionId,
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Transaction ${status} successfully`, 'success');
            closeTransactionModal();
            loadTransactions();
        } else {
            showNotification(data.error || `Failed to ${status} transaction`, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating transaction:', error);
        showNotification('Error updating transaction', 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredTransactions = transactions.filter(transaction => 
        transaction.id.toString().includes(searchTerm) ||
        transaction.user_name.toLowerCase().includes(searchTerm) ||
        transaction.user_email.toLowerCase().includes(searchTerm) ||
        transaction.type.toLowerCase().includes(searchTerm)
    );
    
    updateTransactionTable(filteredTransactions);
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadTransactions();
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

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

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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

function showLoading(show) {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../../index.html';
    }
}

// Load pending withdrawals
async function loadPendingWithdrawals() {
    try {
        const response = await fetch('../../api/admin/pending-withdrawals.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch pending withdrawals');
        
        const withdrawals = await response.json();
        const withdrawalsList = document.getElementById('pendingWithdrawalsList');
        withdrawalsList.innerHTML = '';
        
        withdrawals.forEach(withdrawal => {
            const card = document.createElement('div');
            card.className = 'withdrawal-card';
            card.innerHTML = `
                <div class="withdrawal-header">
                    <div class="user-info">
                        <img src="${withdrawal.userAvatar || '../../assets/default-avatar.png'}" alt="User Avatar">
                        <div>
                            <strong>${withdrawal.username}</strong>
                            <small>User ID: ${withdrawal.userId}</small>
                        </div>
                    </div>
                    <div class="amount">
                        <strong>${formatCurrency(withdrawal.amount)}</strong>
                        <small>Requested: ${formatDateTime(new Date(withdrawal.requestDate))}</small>
                    </div>
                </div>
                <div class="withdrawal-details">
                    <div class="detail-row">
                        <span>Payment Method:</span>
                        <strong>${withdrawal.paymentMethod}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Wallet/Account:</span>
                        <strong>${withdrawal.walletAddress}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Current Balance:</span>
                        <strong>${formatCurrency(withdrawal.currentBalance)}</strong>
                    </div>
                </div>
                <div class="withdrawal-actions">
                    <button onclick="approveWithdrawal(${withdrawal.id})" class="btn btn-success">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="rejectWithdrawal(${withdrawal.id})" class="btn btn-danger">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button onclick="viewUserHistory(${withdrawal.userId})" class="btn btn-info">
                        <i class="fas fa-history"></i> History
                    </button>
                </div>
            `;
            withdrawalsList.appendChild(card);
        });
        
        // Update counter
        document.getElementById('pendingWithdrawalsCount').textContent = withdrawals.length;
    } catch (error) {
        console.error('Error loading pending withdrawals:', error);
        showNotification('error', 'Failed to load pending withdrawals');
    }
}

// Load rejected transactions
async function loadRejectedTransactions() {
    try {
        const response = await fetch('../../api/admin/rejected-transactions.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch rejected transactions');
        
        const transactions = await response.json();
        const transactionsList = document.getElementById('rejectedTransactionsList');
        transactionsList.innerHTML = '';
        
        transactions.forEach(transaction => {
            const card = document.createElement('div');
            card.className = 'transaction-card rejected';
            card.innerHTML = `
                <div class="transaction-header">
                    <div class="transaction-type">
                        <i class="fas ${getTransactionIcon(transaction.type)}"></i>
                        <span>${capitalizeFirst(transaction.type)}</span>
                    </div>
                    <div class="transaction-amount">
                        <strong>${formatCurrency(transaction.amount)}</strong>
                        <small>${formatDateTime(new Date(transaction.date))}</small>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="detail-row">
                        <span>User:</span>
                        <strong>${transaction.username}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Reason:</span>
                        <strong>${transaction.rejectionReason}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Rejected By:</span>
                        <strong>${transaction.rejectedBy}</strong>
                    </div>
                </div>
                <div class="transaction-actions">
                    <button onclick="reviewTransaction(${transaction.id})" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Review
                    </button>
                    <button onclick="reverseRejection(${transaction.id})" class="btn btn-warning">
                        <i class="fas fa-undo"></i> Reverse
                    </button>
                </div>
            `;
            transactionsList.appendChild(card);
        });
        
        // Update counter
        document.getElementById('rejectedCount').textContent = transactions.length;
    } catch (error) {
        console.error('Error loading rejected transactions:', error);
        showNotification('error', 'Failed to load rejected transactions');
    }
}

// Manual fund adjustment
async function loadUsers() {
    try {
        const response = await fetch('../../api/admin/users-list.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        const userSelect = document.getElementById('adjustmentUser');
        userSelect.innerHTML = '<option value="">Select User</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.email})`;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('error', 'Failed to load users list');
    }
}

async function submitAdjustment(event) {
    event.preventDefault();
    
    const userId = document.getElementById('adjustmentUser').value;
    const type = document.getElementById('adjustmentType').value;
    const amount = document.getElementById('adjustmentAmount').value;
    const reason = document.getElementById('adjustmentReason').value;
    
    try {
        const response = await fetch('../../api/admin/adjust-funds.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                userId,
                type,
                amount,
                reason
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit adjustment');
        
        showNotification('success', 'Fund adjustment completed successfully');
        closeModal('manualAdjustmentModal');
        loadTransactions(); // Refresh transaction list
    } catch (error) {
        console.error('Error submitting adjustment:', error);
        showNotification('error', 'Failed to submit fund adjustment');
    }
}

// Withdrawal approval/rejection
async function approveWithdrawal(withdrawalId) {
    if (!confirm('Are you sure you want to approve this withdrawal?')) return;
    
    try {
        const response = await fetch('../../api/admin/approve-withdrawal.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ withdrawalId })
        });
        
        if (!response.ok) throw new Error('Failed to approve withdrawal');
        
        showNotification('success', 'Withdrawal approved successfully');
        loadPendingWithdrawals();
        loadTransactions();
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showNotification('error', 'Failed to approve withdrawal');
    }
}

async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
        const response = await fetch('../../api/admin/reject-withdrawal.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ withdrawalId, reason })
        });
        
        if (!response.ok) throw new Error('Failed to reject withdrawal');
        
        showNotification('success', 'Withdrawal rejected successfully');
        loadPendingWithdrawals();
        loadTransactions();
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showNotification('error', 'Failed to reject withdrawal');
    }
}

// Transaction review and reversal
async function reviewTransaction(transactionId) {
    try {
        const response = await fetch(`../../api/admin/transaction-details.php?id=${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch transaction details');
        
        const transaction = await response.json();
        document.getElementById('transactionDetails').innerHTML = `
            <div class="details-section">
                <h4>Transaction Information</h4>
                <div class="detail-row">
                    <span>Type:</span>
                    <strong>${capitalizeFirst(transaction.type)}</strong>
                </div>
                <div class="detail-row">
                    <span>Amount:</span>
                    <strong>${formatCurrency(transaction.amount)}</strong>
                </div>
                <div class="detail-row">
                    <span>Date:</span>
                    <strong>${formatDateTime(new Date(transaction.date))}</strong>
                </div>
                <div class="detail-row">
                    <span>Status:</span>
                    <strong class="status-${transaction.status}">${capitalizeFirst(transaction.status)}</strong>
                </div>
            </div>
            <div class="details-section">
                <h4>User Information</h4>
                <div class="detail-row">
                    <span>Username:</span>
                    <strong>${transaction.username}</strong>
                </div>
                <div class="detail-row">
                    <span>Email:</span>
                    <strong>${transaction.email}</strong>
                </div>
                <div class="detail-row">
                    <span>Current Balance:</span>
                    <strong>${formatCurrency(transaction.currentBalance)}</strong>
                </div>
            </div>
            ${transaction.rejectionReason ? `
                <div class="details-section">
                    <h4>Rejection Details</h4>
                    <div class="detail-row">
                        <span>Reason:</span>
                        <strong>${transaction.rejectionReason}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Rejected By:</span>
                        <strong>${transaction.rejectedBy}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Rejection Date:</span>
                        <strong>${formatDateTime(new Date(transaction.rejectionDate))}</strong>
                    </div>
                </div>
            ` : ''}
        `;
        
        showModal('transactionDetailsModal');
    } catch (error) {
        console.error('Error reviewing transaction:', error);
        showNotification('error', 'Failed to load transaction details');
    }
}

async function reverseRejection(transactionId) {
    if (!confirm('Are you sure you want to reverse this rejection? This will reprocess the transaction.')) return;
    
    try {
        const response = await fetch('../../api/admin/reverse-rejection.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ transactionId })
        });
        
        if (!response.ok) throw new Error('Failed to reverse rejection');
        
        showNotification('success', 'Rejection reversed successfully');
        loadRejectedTransactions();
        loadTransactions();
    } catch (error) {
        console.error('Error reversing rejection:', error);
        showNotification('error', 'Failed to reverse rejection');
    }
}

// Modal functions
function showPendingWithdrawals() {
    loadPendingWithdrawals();
    showModal('pendingWithdrawalsModal');
}

function showManualAdjustment() {
    loadUsers();
    showModal('manualAdjustmentModal');
}

function showRejectedTransactions() {
    loadRejectedTransactions();
    showModal('rejectedModal');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility functions
function getTransactionIcon(type) {
    const icons = {
        'deposit': 'fa-money-bill-wave',
        'withdrawal': 'fa-money-bill-transfer',
        'roi': 'fa-percentage',
        'referral': 'fa-user-friends',
        'adjustment': 'fa-balance-scale'
    };
    return icons[type] || 'fa-exchange-alt';
}
