import { nip19 } from 'nostr-tools';
import { updateLoginState, fetchUserProfile } from './script.js';
import { RELAY_URLS } from './config.js';

let connectedWallet = null;
let nwcSocket = null;

export function initWallet() {
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  connectWalletBtn.addEventListener('click', connectWallet);
}

export async function connectWallet() {
  try {
    const nwcString = await getNwcStringSecurely();
    if (!nwcString) {
      throw new Error('NWC string is required');
    }

    // Validate and parse the NWC string
    const parsedNwc = parseNwcString(nwcString);
    if (!parsedNwc) {
      throw new Error('Invalid NWC string');
    }

    // Close existing connection if any
    disconnectWallet();

    // Connect to the NWC relay
    await connectToRelay(parsedNwc.relay);

    connectedWallet = parsedNwc.pubkey;
    document.getElementById('pubkeyInput').value = connectedWallet;
    updateLoginState();
    await fetchUserProfile(connectedWallet);
    updateStatusMessage('Wallet connected successfully!');
  } catch (error) {
    console.error('Error connecting wallet:', error);
    updateStatusMessage(`Failed to connect wallet: ${error.message}`, 'error');
  }
}

async function getNwcStringSecurely() {
  // This is a placeholder. In a real application, you'd implement a secure way to get the NWC string,
  // possibly through a dedicated UI component or a secure input method.
  return prompt('Please enter your NWC string:');
}

function parseNwcString(nwcString) {
  try {
    const { type, data } = nip19.decode(nwcString);
    if (type !== 'nwc') {
      throw new Error('Not a valid NWC string');
    }
    return {
      pubkey: data.pubkey,
      relay: data.relay,
      // Note: We're not returning the secret here for security reasons
    };
  } catch (error) {
    console.error('Error parsing NWC string:', error);
    return null;
  }
}

async function connectToRelay(relayUrl) {
  return new Promise((resolve, reject) => {
    nwcSocket = new WebSocket(relayUrl);

    nwcSocket.onopen = () => {
      console.log('Connected to NWC relay');
      resolve();
    };

    nwcSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from NWC relay:', message);
      // Handle incoming messages here
    };

    nwcSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(new Error('Failed to connect to NWC relay'));
    };

    nwcSocket.onclose = () => {
      console.log('Disconnected from NWC relay');
      connectedWallet = null;
      updateLoginState();
      // Implement reconnection logic here
    };
  });
}

export function getConnectedPubkey() {
  return connectedWallet;
}

export async function sendZap(recipient, amountSats, message = '') {
  if (!connectedWallet) {
    throw new Error('Wallet not connected');
  }

  if (!nwcSocket || nwcSocket.readyState !== WebSocket.OPEN) {
    throw new Error('NWC connection is not open');
  }

  const zapRequest = {
    kind: 9734,
    pubkey: connectedWallet,
    created_at: Math.floor(Date.now() / 1000),
    content: message,
    tags: [
      ['p', recipient],
      ['amount', amountSats.toString()],
      ['relays', ...RELAY_URLS]
    ]
  };

  try {
    const requestId = generateRequestId();
    nwcSocket.send(JSON.stringify(['REQ', requestId, zapRequest]));

    const response = await waitForResponse(nwcSocket, requestId);
    if (response.error) {
      throw new Error(response.error);
    }

    console.log('Zap sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending zap:', error);
    throw error;
  }
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15);
}

function waitForResponse(socket, requestId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for NWC response'));
      socket.removeEventListener('message', handleMessage);
    }, 30000); // 30 seconds timeout

    function handleMessage(event) {
      const response = JSON.parse(event.data);
      if (response[1] === requestId) {
        clearTimeout(timeout);
        socket.removeEventListener('message', handleMessage);
        resolve(response);
      }
    }

    socket.addEventListener('message', handleMessage);
  });
}

export function disconnectWallet() {
  if (nwcSocket) {
    nwcSocket.close();
  }
  connectedWallet = null;
  updateLoginState();
}

function updateStatusMessage(message, type = 'info') {
  // This is a placeholder. In a real application, you'd implement a way to show status messages in the UI.
  console.log(`[${type.toUpperCase()}] ${message}`);
  // For example:
  // const statusElement = document.getElementById('statusMessage');
  // statusElement.textContent = message;
  // statusElement.className = `status-${type}`;
}