import React, { useEffect, useState } from 'react';
import { init, Button, PayButton, launchModal, launchPaymentModal, requestProvider } from '@getalby/bitcoin-connect-react';

function App() {
  const [invoice, setInvoice] = useState('');

  useEffect(() => {
    // Initialize Bitcoin Connect
    init({
      appName: 'Zaplist', // your app name
    });
  }, []);

  const handleConnect = async () => {
    const weblnProvider = await requestProvider({
      useExtension: true, // Ensure the Alby browser extension is used
    });
    const { preimage } = await weblnProvider.sendPayment('lnbc...');
    alert('Paid: ' + preimage);
  };

  const handlePay = async () => {
    const invoice = 'lnbc...'; // Fetch or set your invoice here
    setInvoice(invoice);
    await launchPaymentModal({
      invoice,
      onPaid: ({ preimage }) => alert('Paid: ' + preimage),
    });
  };

  return (
    <div className="App">
      <Button onConnect={handleConnect} />
      <PayButton invoice={invoice} onClick={handlePay} onPaid={(response) => alert('Paid! ' + response.preimage)} />
    </div>
  );
}

export default App;
