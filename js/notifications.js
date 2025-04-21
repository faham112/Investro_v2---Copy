class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
        this.checkInterval = 30000; // Check every 30 seconds
        this.unreadCount = 0;
        
        this.init();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    init() {
        this.loadNotifications();
        this.startPolling();
        this.createNotificationIcon();
    }

    createNotificationIcon() {
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge">0</span>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        
        icon.appendChild(dropdown);
        document.body.appendChild(icon);

        icon.addEventListener('click', () => this.toggleDropdown(dropdown));
    }

    toggleDropdown(dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            this.loadNotifications(dropdown);
        }
    }

    async loadNotifications(dropdown = null) {
        try {
            const response = await fetch('../backend/notifications.php');
            const notifications = await response.json();
            
            if (dropdown) {
                dropdown.innerHTML = this.createNotificationList(notifications);
            }
            
            this.updateUnreadCount(notifications.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    createNotificationList(notifications) {
        if (notifications.length === 0) {
            return '<div class="no-notifications">No notifications</div>';
        }

        return `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="mark-all-read">Mark all as read</button>
            </div>
            <div class="notification-list">
                ${notifications.map(notification => this.createNotificationItem(notification)).join('')}
            </div>
        `;
    }

    createNotificationItem(notification) {
        return `
            <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
                 data-id="${notification.id}">
                <div class="notification-icon-${notification.type}">
                    <i class="fas ${this.getIconForType(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.created_at)}</div>
                </div>
            </div>
        `;
    }

    getIconForType(type) {
        const icons = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-times-circle'
        };
        return icons[type] || icons.info;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    }

    updateUnreadCount(count) {
        this.unreadCount = count;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    startPolling() {
        setInterval(() => this.loadNotifications(), this.checkInterval);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getIconForType(type)}"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                this.container.removeChild(notification);
            }, 300);
        }, duration);
    }
}

// Initialize the notification system
const notifications = new NotificationSystem();

// Make it globally available
window.showNotification = (message, type, duration) => {
    notifications.show(message, type, duration);
};
