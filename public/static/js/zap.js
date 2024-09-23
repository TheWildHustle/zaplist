// Zap functionality
let currentZapRecipient = null;

function showZapModal(pubkey, name) {
    currentZapRecipient = pubkey;
    document.getElementById('zapRecipient').textContent = name || pubkey;
    document.getElementById('zapModal').style.display = 'block';
}

function closeZapModal() {
    document.getElementById('zapModal').style.display = 'none';
    currentZapRecipient = null;
}

async function sendZap() {
    const amount = document.getElementById('zapAmount').value;
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const confirmed = await Swal.fire({
        title: 'Confirm Zap',
        text: `Are you sure you want to send ${amount} sats to ${document.getElementById('zapRecipient').textContent}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, send zap!',
        cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) {
        return;
    }

    try {
        const response = await fetch(`/get-lightning-address/${currentZapRecipient}`);
        if (!response.ok) {
            throw new Error('Failed to fetch lightning address');
        }
        const data = await response.json();
        const lightningAddress = data.lightningAddress;

        if (!lightningAddress) {
            alert('Lightning address not found for this user');
            return;
        }

        if (typeof window.webln !== 'undefined') {
            await window.webln.enable();
            const result = await window.webln.sendPayment(lightningAddress, amount);
            Swal.fire('Success!', 'Zap sent successfully!', 'success');
            updateZapHistory(currentZapRecipient, amount, 'sent');
        } else {
            alert('WebLN not available. Please use a WebLN-enabled browser or extension.');
        }
    } catch (error) {
        console.error('Error sending zap:', error);
        Swal.fire('Error', 'Failed to send zap. Please try again.', 'error');
    }

    closeZapModal();
}

function updateZapHistory(recipient, amount, type) {
    const zapHistory = JSON.parse(localStorage.getItem('zapHistory') || '[]');
    zapHistory.unshift({
        recipient,
        amount,
        type,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('zapHistory', JSON.stringify(zapHistory.slice(0, 50)));
    displayZapHistory();
}

function displayZapHistory() {
    const zapHistory = JSON.parse(localStorage.getItem('zapHistory') || '[]');
    const historyContainer = document.getElementById('zapHistory');
    historyContainer.innerHTML = '';
    zapHistory.forEach(zap => {
        const zapElement = document.createElement('div');
        zapElement.textContent = `${zap.type === 'sent' ? 'Sent' : 'Received'} ${zap.amount} sats ${zap.type === 'sent' ? 'to' : 'from'} ${zap.recipient} on ${new Date(zap.timestamp).toLocaleString()}`;
        historyContainer.appendChild(zapElement);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.close-modal').addEventListener('click', closeZapModal);
    document.getElementById('sendZapBtn').addEventListener('click', sendZap);
    displayZapHistory();
});

// Expose the showZapModal function globally
window.showZapModal = showZapModal;