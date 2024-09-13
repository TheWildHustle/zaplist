import React, { useEffect, useState } from 'react';
import { init, Button, PayButton, launchModal, launchPaymentModal, requestProvider } from '@getalby/bitcoin-connect-react';
import { NostrWalletConnect } from './nip47';

function App() {
  const [invoice, setInvoice] = useState('');
  const [walletUri, setWalletUri] = useState('');
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    // Initialize Bitcoin Connect
    init({
      appName: 'Zaplist', // your app name
    });
  }, []);

  const handleConnect = async () => {
    const weblnProvider = await requestProvider();
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

  const handleWalletConnect = () => {
    const uri = prompt('Please enter your wallet URI:');
    if (uri) {
      const newWallet = new NostrWalletConnect(uri);
      newWallet.connect().then(() => {
        setWalletUri(uri);
        setWallet(newWallet);
        alert('Wallet connected successfully');
      }).catch((error) => {
        alert('Failed to connect wallet: ' + error.message);
      });
    }
  };

  const handleWalletPay = async () => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }
    const invoice = prompt('Please enter the invoice to pay:');
    if (invoice) {
      try {
        const preimage = await wallet.payInvoice(invoice);
        alert('Paid: ' + preimage);
      } catch (error) {
        alert('Failed to pay invoice: ' + error.message);
      }
    }
  };

  return (
    <div className="App">
      <Button onConnect={handleConnect} />
      <PayButton invoice={invoice} onClick={handlePay} onPaid={(response) => alert('Paid! ' + response.preimage)} />
      <button onClick={handleWalletConnect}>Connect Wallet</button>
      <button onClick={handleWalletPay}>Pay with Wallet</button>
    </div>
  );
}

export default App;
