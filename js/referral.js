document.addEventListener('DOMContentLoaded', function() {
    loadReferralStats();
    setupEventListeners();
});

function loadReferralStats() {
    fetch('../backend/referral.php?action=stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalReferrals').textContent = data.total_referrals;
            document.getElementById('totalEarnings').textContent = `$${parseFloat(data.total_earnings).toFixed(2)}`;
        })
        .catch(error => showNotification('Error loading referral stats', 'error'));
}

function setupEventListeners() {
    // Copy referral code
    document.getElementById('copyCode').addEventListener('click', function() {
        const codeInput = document.getElementById('referralCode');
        codeInput.select();
        document.execCommand('copy');
        showNotification('Referral code copied!', 'success');
    });

    // Generate new code
    document.getElementById('generateCode').addEventListener('click', function() {
        fetch('../backend/referral.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=generate'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('referralCode').value = data.referral_code;
                showNotification('New referral code generated!', 'success');
            } else {
                throw new Error(data.error);
            }
        })
        .catch(error => showNotification(error.message, 'error'));
    });

    // Claim referral code
    document.getElementById('claimButton').addEventListener('click', function() {
        const code = document.getElementById('claimCode').value;
        if (!code) {
            showNotification('Please enter a referral code', 'warning');
            return;
        }

        fetch('../backend/referral.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=claim&referral_code=${code}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                document.getElementById('claimCode').value = '';
                loadReferralStats();
            } else {
                throw new Error(data.error);
            }
        })
        .catch(error => showNotification(error.message, 'error'));
    });

    // Social sharing
    setupSocialSharing();
}

function setupSocialSharing() {
    const referralCode = document.getElementById('referralCode').value;
    const shareText = `Join me on InvestPro! Use my referral code: ${referralCode}`;
    const shareUrl = encodeURIComponent(window.location.origin);

    document.querySelector('.btn-social.facebook').addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodeURIComponent(shareText)}`);
    });

    document.querySelector('.btn-social.twitter').addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`);
    });

    document.querySelector('.btn-social.whatsapp').addEventListener('click', () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.origin)}`);
    });
}

function showNotification(message, type) {
    // This function will be implemented in the main notification system
    console.log(`${type}: ${message}`);
}
