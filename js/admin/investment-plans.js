// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadPlanStats();
    loadPlans();
    loadActiveInvestments();
    initializeCharts();
    updateAnalytics();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
}

// Load investment plan statistics
async function loadPlanStats() {
    try {
        const response = await fetch('../../api/admin/investment-stats.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch investment stats');
        
        const stats = await response.json();
        
        // Update statistics
        document.getElementById('activePlans').textContent = stats.activePlans;
        document.getElementById('totalInvestments').textContent = formatCurrency(stats.totalInvestments);
        document.getElementById('activeInvestors').textContent = stats.activeInvestors;
        document.getElementById('totalRoiPaid').textContent = formatCurrency(stats.totalRoiPaid);
    } catch (error) {
        console.error('Error loading investment stats:', error);
        showNotification('error', 'Failed to load investment statistics');
    }
}

// Load investment plans
async function loadPlans() {
    try {
        const statusFilter = document.getElementById('statusFilter').value;
        
        const response = await fetch(`../../api/admin/investment-plans.php?status=${statusFilter}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch investment plans');
        
        const plans = await response.json();
        const plansList = document.getElementById('plansList');
        plansList.innerHTML = '';
        
        plans.forEach(plan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="plan-info">
                        <strong>${plan.name}</strong>
                        <small>${plan.description}</small>
                    </div>
                </td>
                <td>${formatCurrency(plan.minAmount)}</td>
                <td>${formatCurrency(plan.maxAmount)}</td>
                <td>${plan.roiPercentage}% ${capitalizeFirst(plan.roiInterval)}</td>
                <td>${plan.duration} Days</td>
                <td>${plan.totalUsers}</td>
                <td><span class="badge badge-${plan.active ? 'success' : 'warning'}">${plan.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editPlan(${plan.id})" class="btn-icon" title="Edit Plan">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="togglePlanStatus(${plan.id}, ${!plan.active})" class="btn-icon" title="${plan.active ? 'Deactivate' : 'Activate'} Plan">
                            <i class="fas fa-${plan.active ? 'ban' : 'check'}"></i>
                        </button>
                        <button onclick="deletePlan(${plan.id})" class="btn-icon" title="Delete Plan">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            plansList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading investment plans:', error);
        showNotification('error', 'Failed to load investment plans');
    }
}

// Load active investments
async function loadActiveInvestments() {
    try {
        const searchQuery = document.getElementById('searchInvestment').value;
        
        const response = await fetch(`../../api/admin/active-investments.php?search=${searchQuery}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch active investments');
        
        const investments = await response.json();
        const investmentsList = document.getElementById('activeInvestmentsList');
        investmentsList.innerHTML = '';
        
        investments.forEach(investment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="user-info">
                        <img src="${investment.userAvatar || '../../assets/default-avatar.png'}" alt="Avatar" class="user-avatar">
                        <div>
                            <strong>${investment.username}</strong>
                            <small>ID: ${investment.userId}</small>
                        </div>
                    </div>
                </td>
                <td>${investment.planName}</td>
                <td>${formatCurrency(investment.amount)}</td>
                <td>${formatCurrency(investment.roiEarned)}</td>
                <td>${formatDate(investment.startDate)}</td>
                <td>${formatDate(investment.endDate)}</td>
                <td><span class="badge badge-${getStatusClass(investment.status)}">${investment.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewInvestment(${investment.id})" class="btn-icon" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="adjustROI(${investment.id})" class="btn-icon" title="Adjust ROI">
                            <i class="fas fa-sliders-h"></i>
                        </button>
                        ${investment.status === 'active' ? 
                            `<button onclick="terminateInvestment(${investment.id})" class="btn-icon" title="Terminate Investment">
                                <i class="fas fa-stop-circle"></i>
                            </button>` : ''
                        }
                    </div>
                </td>
            `;
            investmentsList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading active investments:', error);
        showNotification('error', 'Failed to load active investments');
    }
}

// Initialize charts
let investmentDistributionChart;
let dailyInvestmentsChart;
let roiPaymentsChart;

function initializeCharts() {
    const distributionCtx = document.getElementById('investmentDistribution').getContext('2d');
    const dailyCtx = document.getElementById('dailyInvestments').getContext('2d');
    const roiCtx = document.getElementById('roiPayments').getContext('2d');
    
    // Investment Distribution Chart
    investmentDistributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#FF5722'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'right',
                labels: {
                    fontColor: '#fff'
                }
            }
        }
    });
    
    // Daily Investments Chart
    dailyInvestmentsChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Investments',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        fontColor: '#fff'
                    }
                }],
                yAxes: [{
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        fontColor: '#fff',
                        callback: value => formatCurrency(value)
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: '#fff'
                }
            }
        }
    });
    
    // ROI Payments Chart
    roiPaymentsChart = new Chart(roiCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'ROI Paid',
                data: [],
                backgroundColor: '#FFC107',
                borderColor: '#FFA000',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        fontColor: '#fff'
                    }
                }],
                yAxes: [{
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        fontColor: '#fff',
                        callback: value => formatCurrency(value)
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: '#fff'
                }
            }
        }
    });
}

// Update analytics charts
async function updateAnalytics() {
    const days = document.getElementById('analyticsTimeframe').value;
    
    try {
        const response = await fetch(`../../api/admin/investment-analytics.php?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        
        const data = await response.json();
        
        // Update Investment Distribution Chart
        investmentDistributionChart.data.labels = data.distribution.labels;
        investmentDistributionChart.data.datasets[0].data = data.distribution.data;
        investmentDistributionChart.update();
        
        // Update Daily Investments Chart
        dailyInvestmentsChart.data.labels = data.daily.labels;
        dailyInvestmentsChart.data.datasets[0].data = data.daily.data;
        dailyInvestmentsChart.update();
        
        // Update ROI Payments Chart
        roiPaymentsChart.data.labels = data.roi.labels;
        roiPaymentsChart.data.datasets[0].data = data.roi.data;
        roiPaymentsChart.update();
    } catch (error) {
        console.error('Error updating analytics:', error);
        showNotification('error', 'Failed to update analytics');
    }
}

// Modal functions
function openAddPlanModal() {
    document.getElementById('modalTitle').textContent = 'Add New Plan';
    document.getElementById('planForm').reset();
    document.getElementById('planModal').style.display = 'block';
}

function openEditPlanModal(plan) {
    document.getElementById('modalTitle').textContent = 'Edit Plan';
    
    // Fill form with plan data
    document.getElementById('planName').value = plan.name;
    document.getElementById('minAmount').value = plan.minAmount;
    document.getElementById('maxAmount').value = plan.maxAmount;
    document.getElementById('roiPercentage').value = plan.roiPercentage;
    document.getElementById('roiInterval').value = plan.roiInterval;
    document.getElementById('duration').value = plan.duration;
    document.getElementById('referralBonus').value = plan.referralBonus;
    document.getElementById('description').value = plan.description;
    document.getElementById('isActive').checked = plan.active;
    
    document.getElementById('planModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('planModal').style.display = 'none';
}

// Plan management functions
async function savePlan(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('planForm'));
    const planData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('../../api/admin/save-plan.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(planData)
        });
        
        if (!response.ok) throw new Error('Failed to save plan');
        
        showNotification('success', 'Plan saved successfully');
        closeModal();
        loadPlans();
        loadPlanStats();
    } catch (error) {
        console.error('Error saving plan:', error);
        showNotification('error', 'Failed to save plan');
    }
}

async function editPlan(planId) {
    try {
        const response = await fetch(`../../api/admin/investment-plan.php?id=${planId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch plan details');
        
        const plan = await response.json();
        openEditPlanModal(plan);
    } catch (error) {
        console.error('Error fetching plan details:', error);
        showNotification('error', 'Failed to load plan details');
    }
}

async function togglePlanStatus(planId, active) {
    if (!confirm(`Are you sure you want to ${active ? 'activate' : 'deactivate'} this plan?`)) return;
    
    try {
        const response = await fetch('../../api/admin/toggle-plan.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ planId, active })
        });
        
        if (!response.ok) throw new Error('Failed to update plan status');
        
        showNotification('success', `Plan ${active ? 'activated' : 'deactivated'} successfully`);
        loadPlans();
        loadPlanStats();
    } catch (error) {
        console.error('Error updating plan status:', error);
        showNotification('error', 'Failed to update plan status');
    }
}

async function deletePlan(planId) {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`../../api/admin/delete-plan.php?id=${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete plan');
        
        showNotification('success', 'Plan deleted successfully');
        loadPlans();
        loadPlanStats();
    } catch (error) {
        console.error('Error deleting plan:', error);
        showNotification('error', 'Failed to delete plan');
    }
}

// Investment management functions
async function viewInvestment(investmentId) {
    try {
        const response = await fetch(`../../api/admin/investment-details.php?id=${investmentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch investment details');
        
        const investment = await response.json();
        // Implement investment details modal
        console.log('Investment details:', investment);
    } catch (error) {
        console.error('Error fetching investment details:', error);
        showNotification('error', 'Failed to load investment details');
    }
}

async function adjustROI(investmentId) {
    const adjustment = prompt('Enter ROI adjustment amount (+ or -):');
    if (!adjustment) return;
    
    try {
        const response = await fetch('../../api/admin/adjust-roi.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ investmentId, adjustment })
        });
        
        if (!response.ok) throw new Error('Failed to adjust ROI');
        
        showNotification('success', 'ROI adjusted successfully');
        loadActiveInvestments();
    } catch (error) {
        console.error('Error adjusting ROI:', error);
        showNotification('error', 'Failed to adjust ROI');
    }
}

async function terminateInvestment(investmentId) {
    if (!confirm('Are you sure you want to terminate this investment? This action cannot be undone.')) return;
    
    try {
        const response = await fetch('../../api/admin/terminate-investment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ investmentId })
        });
        
        if (!response.ok) throw new Error('Failed to terminate investment');
        
        showNotification('success', 'Investment terminated successfully');
        loadActiveInvestments();
        loadPlanStats();
    } catch (error) {
        console.error('Error terminating investment:', error);
        showNotification('error', 'Failed to terminate investment');
    }
}

// Export functions
function exportPlans() {
    const statusFilter = document.getElementById('statusFilter').value;
    window.location.href = `../../api/admin/export-plans.php?status=${statusFilter}&token=${localStorage.getItem('adminToken')}`;
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getStatusClass(status) {
    const statusClasses = {
        'active': 'success',
        'completed': 'info',
        'terminated': 'danger'
    };
    return statusClasses[status] || 'default';
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

// Initialize event listeners
function initializeEventListeners() {
    // Form submission
    document.getElementById('planForm').addEventListener('submit', savePlan);
    
    // Modal close button
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Status filter
    document.getElementById('statusFilter').addEventListener('change', loadPlans);
    
    // Search investment
    document.getElementById('searchInvestment').addEventListener('input', debounce(loadActiveInvestments, 300));
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('planModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Debounce function
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
