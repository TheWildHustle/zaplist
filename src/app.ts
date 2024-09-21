import { NostrWalletConnect } from './NostrWalletConnect';

// Create an instance of NostrWalletConnect
const wallet = new NostrWalletConnect('');

// Define connectWallet function
async function connectWallet(connectionUri: string) {
  wallet = new NostrWalletConnect(connectionUri);
  try {
    await wallet.connect();
    console.log('Wallet connected successfully');
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
}

// Define disconnectWallet function
async function disconnectWallet() {
  try {
    await wallet.disconnect();
    console.log('Wallet disconnected successfully');
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
  }
}

// Define payInvoice function
async function payInvoice(invoice: string, amount: number) {
  try {
    const preimage = await wallet.payInvoice(invoice, amount);
    console.log('Zap sent successfully. Preimage:', preimage);
    return preimage;
  } catch (error) {
    console.error('Failed to send zap:', error);
    throw error;
  }
}

// Define getBalance function
async function getBalance() {
  try {
    const balance = await wallet.getBalance();
    console.log('Current balance:', balance);
    return balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}



// Use these functions in your UI handlers
// For example:
// document.getElementById('zapButton').addEventListener('click', () => handleZap(invoice, amount));
// document.getElementById('balanceButton').addEventListener('click', displayBalance);

// Don't forget to disconnect the wallet when the app closes
window.addEventListener('beforeunload', disconnectWallet);

// Define handleZap function
async function handleZap(invoice: string, amount: number) {
  try {
    const preimage = await payInvoice(invoice, amount);
    console.log('Zap sent successfully. Preimage:', preimage);
    // Update UI or perform any other actions after successful zap
  } catch (error) {
    console.error('Failed to send zap:', error);
    // Handle error (e.g., show error message to user)
  }
}

// Define displayBalance function
async function displayBalance() {
  try {
    const balance = await getBalance();
    console.log('Current balance:', balance);
    // Update UI to display balance
  } catch (error) {
    console.error('Failed to get balance:', error);
    // Handle error
  }
}

// Call initializeWallet function
initializeWallet();