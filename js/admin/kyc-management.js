document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    let totalPages = 1;
    let currentKycId = null;

    // Initial load
    loadKycRequests();
    setupEventListeners();

    function loadKycRequests(page = 1) {
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('searchKyc').value;

        fetch(`../../backend/admin/kyc.php?action=list&page=${page}&status=${status}&search=${search}`)
            .then(response => response.json())
            .then(data => {
                renderKycTable(data.requests);
                updatePagination(data.currentPage, data.totalPages);
                currentPage = data.currentPage;
                totalPages = data.totalPages;
            })
            .catch(error => showNotification('Error loading KYC requests', 'error'));
    }

    function renderKycTable(requests) {
        const tbody = document.getElementById('kycTableBody');
        tbody.innerHTML = '';

        requests.forEach(request => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${request.user_id}</td>
                <td>${request.full_name}</td>
                <td>${formatDate(request.submitted_at)}</td>
                <td><span class="status-badge ${request.status}">${request.status}</span></td>
                <td>
                    <button class="btn-view" onclick="viewKycDetails(${request.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updatePagination(currentPage, totalPages) {
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    function setupEventListeners() {
        // Search input
        let searchTimeout;
        document.getElementById('searchKyc').addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadKycRequests(1), 500);
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', () => loadKycRequests(1));

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (currentPage > 1) loadKycRequests(currentPage - 1);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (currentPage < totalPages) loadKycRequests(currentPage + 1);
        });

        // Modal close button
        document.querySelector('.close-modal').addEventListener('click', closeModal);

        // KYC action buttons
        document.getElementById('approveKyc').addEventListener('click', () => updateKycStatus('approved'));
        document.getElementById('rejectKyc').addEventListener('click', () => {
            const reason = document.getElementById('rejectionReason').value.trim();
            if (!reason) {
                showNotification('Please provide a reason for rejection', 'warning');
                return;
            }
            updateKycStatus('rejected', reason);
        });
    }

    function viewKycDetails(kycId) {
        currentKycId = kycId;
        fetch(`../../backend/admin/kyc.php?action=view&kyc_id=${kycId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('modalFullName').textContent = data.full_name;
                document.getElementById('modalDob').textContent = formatDate(data.dob);
                document.getElementById('modalAddress').textContent = data.address;
                document.getElementById('modalCity').textContent = data.city;
                document.getElementById('modalCountry').textContent = data.country;
                document.getElementById('modalIdType').textContent = data.id_type.replace('_', ' ').toUpperCase();
                
                document.getElementById('modalIdDocument').src = `../../${data.id_document}`;
                document.getElementById('modalSelfie').src = `../../${data.selfie}`;
                
                document.getElementById('kycModal').style.display = 'block';
                
                // Show/hide action buttons based on status
                const actionButtons = document.querySelector('.kyc-actions');
                actionButtons.style.display = data.status === 'pending' ? 'flex' : 'none';
            })
            .catch(error => showNotification('Error loading KYC details', 'error'));
    }

    function updateKycStatus(status, reason = '') {
        if (!currentKycId) return;

        const formData = new FormData();
        formData.append('action', 'update_status');
        formData.append('kyc_id', currentKycId);
        formData.append('status', status);
        formData.append('rejection_reason', reason);

        fetch('../../backend/admin/kyc.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(`KYC ${status} successfully`, 'success');
                closeModal();
                loadKycRequests(currentPage);
            } else {
                throw new Error(data.error);
            }
        })
        .catch(error => showNotification(error.message, 'error'));
    }

    function closeModal() {
        document.getElementById('kycModal').style.display = 'none';
        document.getElementById('rejectionReason').value = '';
        currentKycId = null;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
