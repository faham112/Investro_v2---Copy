document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeFilters();
    loadSecurityStats();
    loadSuspiciousActivities();
    loadBlockedIPs();
    initializeModals();
    initializeFormHandlers();
    initializeWebSocket();
    
    // Refresh data periodically
    setInterval(loadSecurityStats, 60000); // Every minute
    setInterval(loadSuspiciousActivities, 60000); // Every minute
    setInterval(loadBlockedIPs, 300000); // Every 5 minutes
});

// WebSocket for real-time security updates
function initializeWebSocket() {
    const ws = new WebSocket('wss://' + window.location.host + '/ws/security');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        switch(data.type) {
            case 'suspicious_activity':
                handleNewSuspiciousActivity(data.activity);
                break;
            case 'ip_blocked':
                handleIPBlocked(data.ip);
                break;
            case 'security_alert':
                showNotification(data.message, 'warning');
                break;
        }
    };
    
    ws.onclose = function() {
        setTimeout(initializeWebSocket, 5000); // Reconnect after 5 seconds
    };
}

function loadSecurityStats() {
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'get_stats'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateSecurityStats(data.stats);
        } else {
            showNotification(data.error || 'Failed to load security statistics', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading security stats:', error);
        showNotification('Error loading security statistics', 'error');
    });
}

function updateSecurityStats(stats) {
    document.getElementById('failedLogins').textContent = formatNumber(stats.failed_logins);
    document.getElementById('blockedIPs').textContent = formatNumber(stats.blocked_ips);
    document.getElementById('twoFactorUsers').textContent = formatNumber(stats.two_factor_users);
    
    document.getElementById('loginChange').innerHTML = formatChange(stats.login_change);
    document.getElementById('blockChange').innerHTML = formatChange(stats.block_change);
    document.getElementById('twoFactorChange').innerHTML = formatChange(stats.two_factor_change);
}

function initializeFilters() {
    // Activity filters
    document.getElementById('activityType').addEventListener('change', loadSuspiciousActivities);
    document.getElementById('severityFilter').addEventListener('change', loadSuspiciousActivities);
    document.getElementById('activityDate').addEventListener('change', loadSuspiciousActivities);
    
    // IP search
    document.getElementById('ipSearch').addEventListener('input', debounce(function(e) {
        filterBlockedIPs(e.target.value);
    }, 300));
    
    // Block reason handler
    document.getElementById('blockReason').addEventListener('change', function(e) {
        const otherReasonGroup = document.getElementById('otherReasonGroup');
        otherReasonGroup.style.display = e.target.value === 'other' ? 'block' : 'none';
    });
    
    // Block duration handler
    document.getElementById('blockDurationType').addEventListener('change', function(e) {
        const durationGroup = document.getElementById('blockDurationGroup');
        durationGroup.style.display = e.target.value === 'temporary' ? 'block' : 'none';
    });
}

function loadSuspiciousActivities() {
    const type = document.getElementById('activityType').value;
    const severity = document.getElementById('severityFilter').value;
    const date = document.getElementById('activityDate').value;
    
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'get_suspicious',
            type: type,
            severity: severity,
            date: date
        })
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('suspiciousActivities');
        container.innerHTML = '';
        
        data.activities.forEach(activity => {
            const activityEl = createActivityElement(activity);
            container.appendChild(activityEl);
        });
    })
    .catch(error => {
        console.error('Error loading suspicious activities:', error);
        showNotification('Error loading suspicious activities', 'error');
    });
}

function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    
    const icon = getActivityIcon(activity.action);
    const timestamp = new Date(activity.created_at).toLocaleString();
    
    div.innerHTML = `
        <div class="activity-icon ${activity.action}">
            <i class="fas ${icon}"></i>
        </div>
        <div class="activity-details">
            <div class="activity-header">
                <span class="activity-type">${formatActivityType(activity.action)}</span>
                <span class="activity-time">${timestamp}</span>
            </div>
            <div class="activity-description">${activity.details}</div>
            <div class="activity-meta">
                <span>User: ${activity.email || 'Unknown'}</span>
                <span>IP: ${activity.ip_address}</span>
            </div>
        </div>
        <div class="activity-actions">
            <button onclick="investigateActivity(${activity.id})" class="btn-secondary">
                <i class="fas fa-search"></i>
            </button>
            <button onclick="blockIP('${activity.ip_address}')" class="btn-danger">
                <i class="fas fa-ban"></i>
            </button>
        </div>
    `;
    
    return div;
}

function loadBlockedIPs() {
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'get_blocked_ips'
        })
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('blockedIPsList');
        container.innerHTML = '';
        
        data.ips.forEach(ip => {
            const ipEl = createBlockedIPElement(ip);
            container.appendChild(ipEl);
        });
    })
    .catch(error => {
        console.error('Error loading blocked IPs:', error);
        showNotification('Error loading blocked IPs', 'error');
    });
}

function createBlockedIPElement(ip) {
    const div = document.createElement('div');
    div.className = 'blocked-ip-item';
    
    const expiresAt = ip.expires_at ? new Date(ip.expires_at).toLocaleString() : 'Never';
    
    div.innerHTML = `
        <div class="ip-info">
            <div class="ip-address">${ip.ip_address}</div>
            <div class="ip-meta">
                <span>Blocked: ${new Date(ip.blocked_at).toLocaleString()}</span>
                <span>Expires: ${expiresAt}</span>
            </div>
            <div class="ip-reason">${ip.reason}</div>
        </div>
        <div class="ip-actions">
            <button onclick="unblockIP(${ip.id})" class="btn-secondary">
                <i class="fas fa-unlock"></i> Unblock
            </button>
        </div>
    `;
    
    return div;
}

function handleNewSuspiciousActivity(activity) {
    const container = document.getElementById('suspiciousActivities');
    const activityEl = createActivityElement(activity);
    
    container.insertBefore(activityEl, container.firstChild);
    if (container.children.length > 50) { // Keep only last 50 activities
        container.removeChild(container.lastChild);
    }
    
    // Update stats if needed
    loadSecurityStats();
}

function handleIPBlocked(ip) {
    const container = document.getElementById('blockedIPsList');
    const ipEl = createBlockedIPElement(ip);
    
    container.insertBefore(ipEl, container.firstChild);
    loadSecurityStats();
}

function investigateActivity(activityId) {
    showLoading(true);
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'get_activity_details',
            activity_id: activityId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayActivityDetails(data.details);
            document.getElementById('activityDetailsModal').style.display = 'block';
        } else {
            showNotification(data.error || 'Failed to load activity details', 'error');
        }
        showLoading(false);
    })
    .catch(error => {
        console.error('Error loading activity details:', error);
        showNotification('Error loading activity details', 'error');
        showLoading(false);
    });
}

function displayActivityDetails(details) {
    document.getElementById('detailType').textContent = formatActivityType(details.type);
    document.getElementById('detailSeverity').textContent = details.severity;
    document.getElementById('detailSeverity').className = `severity ${details.severity}`;
    document.getElementById('detailTime').textContent = new Date(details.timestamp).toLocaleString();
    document.getElementById('detailIP').textContent = details.ip_address;
    document.getElementById('detailUserAgent').textContent = details.user_agent;
    document.getElementById('detailLocation').textContent = details.location;
    document.getElementById('detailDescription').textContent = details.description;
}

function markAsThreat() {
    const ip = document.getElementById('detailIP').textContent;
    blockIP(ip, 'Marked as threat', 'permanent');
    document.getElementById('activityDetailsModal').style.display = 'none';
}

function markAsFalsePositive() {
    const activityId = document.getElementById('activityDetailsModal').dataset.activityId;
    
    showLoading(true);
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'mark_false_positive',
            activity_id: activityId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Activity marked as false positive', 'success');
            document.getElementById('activityDetailsModal').style.display = 'none';
            loadSuspiciousActivities();
        } else {
            showNotification(data.error || 'Failed to mark as false positive', 'error');
        }
        showLoading(false);
    })
    .catch(error => {
        console.error('Error marking as false positive:', error);
        showNotification('Error marking as false positive', 'error');
        showLoading(false);
    });
}

function saveSecuritySettings() {
    const settings = {
        login_attempts: document.getElementById('loginAttempts').value,
        block_duration: document.getElementById('blockDuration').value,
        password_requirements: {
            uppercase: document.getElementById('requireUppercase').checked,
            numbers: document.getElementById('requireNumbers').checked,
            special: document.getElementById('requireSpecial').checked
        },
        two_factor_auth: {
            admin: document.getElementById('require2FAAdmin').checked,
            withdrawals: document.getElementById('require2FAWithdraw').checked,
            all_logins: document.getElementById('require2FALogin').checked
        }
    };
    
    showLoading(true);
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'update_settings',
            settings: settings
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Security settings updated successfully', 'success');
        } else {
            showNotification(data.error || 'Failed to update security settings', 'error');
        }
        showLoading(false);
    })
    .catch(error => {
        console.error('Error updating security settings:', error);
        showNotification('Error updating security settings', 'error');
        showLoading(false);
    });
}

function blockIP(ip, reason = '', duration = '24h') {
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'block_ip',
            ip: ip,
            reason: reason,
            duration: duration
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('IP blocked successfully', 'success');
            document.getElementById('blockIPModal').style.display = 'none';
            loadBlockedIPs();
        } else {
            showNotification(data.error || 'Failed to block IP', 'error');
        }
    })
    .catch(error => {
        console.error('Error blocking IP:', error);
        showNotification('Error blocking IP', 'error');
    });
}

function unblockIP(id) {
    if (!confirm('Are you sure you want to unblock this IP?')) {
        return;
    }
    
    fetch('../../backend/admin/security.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'unblock_ip',
            id: id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('IP unblocked successfully', 'success');
            loadBlockedIPs();
        } else {
            showNotification(data.error || 'Failed to unblock IP', 'error');
        }
    })
    .catch(error => {
        console.error('Error unblocking IP:', error);
        showNotification('Error unblocking IP', 'error');
    });
}

function getActivityIcon(action) {
    const icons = {
        'login': 'fa-sign-in-alt',
        'suspicious_login': 'fa-exclamation-triangle',
        'suspicious_transaction': 'fa-money-bill-wave',
        'kyc_update': 'fa-id-card',
        'password_reset': 'fa-key',
        'profile_update': 'fa-user-edit',
        'default': 'fa-info-circle'
    };
    
    return icons[action] || icons.default;
}

function formatActivityType(action) {
    return action.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function showNotification(message, type = 'info') {
    // Implement your notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
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

function formatNumber(num) {
    return num.toLocaleString();
}

function formatChange(change) {
    if (change > 0) {
        return `<span class="text-success">+${formatNumber(change)}%</span>`;
    } else if (change < 0) {
        return `<span class="text-danger">${formatNumber(change)}%</span>`;
    } else {
        return `<span class="text-muted">0%</span>`;
    }
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = show ? 'block' : 'none';
}
