document.addEventListener('DOMContentLoaded', () => {
    const generateInvoiceBtn = document.getElementById('generate-invoice');
    const amountInput = document.getElementById('amount');
    const invoiceDisplay = document.getElementById('invoice-display');
    const invoiceElement = document.getElementById('invoice');
    const payInvoiceBtn = document.getElementById('pay-invoice');
    const paymentStatus = document.getElementById('payment-status');
    let webln;

    generateInvoiceBtn.addEventListener('click', async () => {
        const amount = amountInput.value;
        if (!amount) {
            alert('Please enter an amount');
            return;
        }

        try {
            const response = await fetch('/generate_invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount }),
            });
            const data = await response.json();
            invoiceElement.textContent = data.invoice;
            invoiceDisplay.style.display = 'block';
        } catch (error) {
            console.error('Failed to generate invoice:', error);
        }
    });

    payInvoiceBtn.addEventListener('click', async () => {
        const invoice = invoiceElement.textContent;
        if (!invoice) {
            alert('No invoice to pay');
            return;
        }

        try {
            const result = await webln.sendPayment(invoice);
            paymentStatus.textContent = `Payment successful! Preimage: ${result.preimage}`;
            paymentStatus.style.display = 'block';
        } catch (error) {
            console.error('Payment failed:', error);
            paymentStatus.textContent = 'Payment failed: ' + error.message;
            paymentStatus.style.display = 'block';
        }
    });
});