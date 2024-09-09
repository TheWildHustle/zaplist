import React, { useState, useEffect } from 'react';
import { connectWallet, disconnectWallet, payInvoice, getBalance } from './wallet';
import NWCButton from './components/NWCButton';

function App() {
  const [balance, setBalance] = useState(null);
  const [invoice, setInvoice] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    // Initialize wallet when component mounts
    initializeWallet();

    // Disconnect wallet when component unmounts
    return () => {
      disconnectWallet();
    };
  }, []);

  async function initializeWallet() {
    try {
      await connectWallet();
      console.log('Wallet connected successfully');
      await updateBalance();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }

  async function handleZap() {
    try {
      const preimage = await payInvoice(invoice, parseFloat(amount));
      console.log('Zap sent successfully. Preimage:', preimage);
      await updateBalance();
      // Clear input fields after successful zap
      setInvoice('');
      setAmount('');
    } catch (error) {
      console.error('Failed to send zap:', error);
      // Handle error (e.g., show error message to user)
    }
  }

  async function updateBalance() {
    try {
      const currentBalance = await getBalance();
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      // Handle error
    }
  }

  return (
    <div className="App">
      <h1>Zaplist</h1>
      <NWCButton />
      <div>
        <h2>Current Balance: {balance !== null ? balance : 'Loading...'}</h2>
        <button onClick={updateBalance}>Refresh Balance</button>
      </div>
      <div>
        <h2>Send Zap</h2>
        <input
          type="text"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="Enter invoice"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <button onClick={handleZap}>Send Zap</button>
      </div>
    </div>
  );
}

export default App;