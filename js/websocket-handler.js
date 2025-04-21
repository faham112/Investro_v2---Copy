class WebSocketHandler {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 seconds
        this.listeners = new Map();
    }

    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:8080/ws`;
            
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.authenticate();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.handleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }

    authenticate() {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            this.send({
                type: 'auth',
                token: authToken
            });
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'withdrawal_status':
                this.updateWithdrawalStatus(data);
                break;
            case 'balance_update':
                this.updateBalance(data);
                break;
            case 'investment_update':
                this.updateInvestment(data);
                break;
            case 'notification':
                this.showNotification(data);
                break;
            default:
                console.log('Unhandled message type:', data.type);
        }

        // Notify all listeners for this message type
        if (this.listeners.has(data.type)) {
            this.listeners.get(data.type).forEach(callback => callback(data));
        }
    }

    updateWithdrawalStatus(data) {
        const { status, amount, message } = data;
        // Update withdrawal status in UI
        const withdrawalElement = document.querySelector('.withdrawal-status');
        if (withdrawalElement) {
            withdrawalElement.textContent = message;
            withdrawalElement.className = `withdrawal-status ${status}`;
        }

        // Show notification
        this.showNotification({
            title: 'Withdrawal Update',
            message: message,
            type: status
        });

        // Update balance if withdrawal is approved
        if (status === 'approved') {
            this.updateBalance({ amount: -amount });
        }
    }

    updateBalance(data) {
        const balanceElement = document.querySelector('.balance-amount');
        if (balanceElement) {
            const currentBalance = parseFloat(balanceElement.textContent.replace('$', '').replace(',', ''));
            const newBalance = (currentBalance + parseFloat(data.amount)).toFixed(2);
            balanceElement.textContent = `$${Number(newBalance).toLocaleString()}`;
        }
    }

    updateInvestment(data) {
        const { roi, activeInvestment } = data;
        const roiElement = document.querySelector('.balance-change');
        const investmentElement = document.querySelector('.active-investment .stat-amount');
        
        if (roiElement && roi) {
            roiElement.innerHTML = `
                <i class="fas fa-arrow-up"></i>
                +${roi}% this month
            `;
        }
        
        if (investmentElement && activeInvestment) {
            investmentElement.textContent = `$${Number(activeInvestment).toLocaleString()}`;
        }
    }

    showNotification(data) {
        const { title, message, type } = data;
        const container = document.querySelector('.notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Add event listener
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
    }

    // Remove event listener
    off(eventType, callback) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(callback);
        }
    }
}

// Export for use in other files
window.WebSocketHandler = WebSocketHandler;
