import { NostrWalletConnect } from './nip47';

let walletConnect = null;

export async function connectWallet(connectionUri) {
  walletConnect = new NostrWalletConnect(connectionUri);
  await walletConnect.connect();
}

export async function disconnectWallet() {
  if (walletConnect) {
    await walletConnect.disconnect();
    walletConnect = null;
  }
}

export async function payInvoice(invoice, amount) {
  if (!walletConnect) {
    throw new Error('Wallet not connected');
  }
  return walletConnect.payInvoice(invoice, amount);
}

export async function getBalance() {
  if (!walletConnect) {
    throw new Error('Wallet not connected');
  }
  return walletConnect.getBalance();
}

// Add more wallet-related functions as needed

// Ensure wallet is not connected during login
export function isWalletConnected() {
  return walletConnect !== null;
}
