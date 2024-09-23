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

    try {
        // Fetch the lightning address for the recipient
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

        // Use the WebLN API to send the payment
        if (typeof window.webln !== 'undefined') {
            await window.webln.enable();
            await window.webln.sendPayment(lightningAddress, amount);
            alert('Zap sent successfully!');
        } else {
            alert('WebLN not available. Please use a WebLN-enabled browser or extension.');
        }
    } catch (error) {
        console.error('Error sending zap:', error);
        alert('Failed to send zap. Please try again.');
    }

    closeZapModal();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.close-modal').addEventListener('click', closeZapModal);
    document.getElementById('sendZapBtn').addEventListener('click', sendZap);
});

// Expose the showZapModal function globally
window.showZapModal = showZapModal;