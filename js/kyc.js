document.addEventListener('DOMContentLoaded', function() {
    loadCountries();
    setupFileUploads();
    checkKycStatus();
    setupFormSubmission();
});

function loadCountries() {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            const countrySelect = document.getElementById('country');
            const countries = data.map(country => country.name.common).sort();
            
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countrySelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading countries:', error));
}

function setupFileUploads() {
    ['idDocument', 'selfie'].forEach(inputId => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(inputId + 'Preview');

        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5000000) { // 5MB limit
                    showNotification('File size should not exceed 5MB', 'error');
                    input.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    preview.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

function checkKycStatus() {
    fetch('../backend/kyc.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=status'
    })
    .then(response => response.json())
    .then(data => {
        updateKycStatus(data.status);
        if (data.status !== 'not_submitted') {
            document.getElementById('kycForm').style.display = 'none';
            
            if (data.rejection_reason) {
                showNotification(`Verification rejected: ${data.rejection_reason}`, 'error');
            }
        }
    })
    .catch(error => showNotification('Error checking KYC status', 'error'));
}

function updateKycStatus(status) {
    const statusElement = document.getElementById('kycStatus');
    const statusText = document.getElementById('statusText');
    
    statusElement.className = 'kyc-status ' + status;
    statusText.textContent = status.replace('_', ' ').toUpperCase();
    
    const iconMap = {
        'not_submitted': 'fa-file',
        'pending': 'fa-clock',
        'approved': 'fa-check-circle',
        'rejected': 'fa-times-circle'
    };
    
    statusElement.querySelector('i').className = `fas ${iconMap[status]}`;
}

function setupFormSubmission() {
    document.getElementById('kycForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('action', 'submit');

        fetch('../backend/kyc.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                checkKycStatus();
            } else {
                throw new Error(data.error);
            }
        })
        .catch(error => showNotification(error.message, 'error'));
    });
}

function showNotification(message, type) {
    // This function will be implemented in the main notification system
    console.log(`${type}: ${message}`);
}
