import { nip19 } from 'https://esm.sh/nostr-tools@1.17.0'
import { updateLoginState, fetchUserProfile } from './script.js'

let connectedWallet = null
let nwcSocket = null

export function initWallet() {
  const connectWalletBtn = document.getElementById('connectWalletBtn')
  connectWalletBtn.addEventListener('click', connectWallet)
}

export async function connectWallet() {
  try {
    const nwcString = prompt('Please enter your NWC string:')
    if (!nwcString) {
      throw new Error('NWC string is required')
    }

    // Validate and parse the NWC string
    const parsedNwc = parseNwcString(nwcString)
    if (!parsedNwc) {
      throw new Error('Invalid NWC string')
    }

    // Close existing connection if any
    if (nwcSocket) {
      nwcSocket.close()
    }

    // Connect to the NWC relay
    nwcSocket = new WebSocket(parsedNwc.relay)

    nwcSocket.onopen = () => {
      console.log('Connected to NWC relay')
      connectedWallet = parsedNwc.pubkey
      document.getElementById('pubkeyInput').value = connectedWallet
      updateLoginState()
      fetchUserProfile(connectedWallet)
      alert('Wallet connected successfully!')
    }

    nwcSocket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      console.log('Received message from NWC relay:', message)
      // Handle incoming messages here
    }

    nwcSocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      alert('Failed to connect to NWC relay: ' + error.message)
    }

    nwcSocket.onclose = () => {
      console.log('Disconnected from NWC relay')
      connectedWallet = null
      updateLoginState()
    }
  } catch (error) {
    console.error('Error connecting wallet:', error)
    alert('Failed to connect wallet: ' + error.message)
  }
}

function parseNwcString(nwcString) {
  try {
    const { type, data } = nip19.decode(nwcString)
    if (type !== 'nwc') {
      throw new Error('Not a valid NWC string')
    }
    return {
      pubkey: data.pubkey,
      relay: data.relay,
      secret: data.secret
    }
  } catch (error) {
    console.error('Error parsing NWC string:', error)
    return null
  }
}

export function getConnectedPubkey() {
  return connectedWallet
}

export async function sendZap(recipient, amountSats, message = '') {
  if (!connectedWallet) {
    throw new Error('Wallet not connected')
  }

  if (!nwcSocket || nwcSocket.readyState !== WebSocket.OPEN) {
    throw new Error('NWC connection is not open')
  }

  const zapRequest = {
    kind: 9734,
    pubkey: connectedWallet,
    created_at: Math.floor(Date.now() / 1000),
    content: message,
    tags: [
      ['p', recipient],
      ['amount', amountSats.toString()],
      ['relays', 'wss://relay.damus.io', 'wss://relay.nostr.band']
    ]
  }

  try {
    // Send zap request to NWC relay
    nwcSocket.send(JSON.stringify(['REQ', 'zap', zapRequest]))

    // Wait for response
    const response = await waitForResponse(nwcSocket)
    if (response.error) {
      throw new Error(response.error)
    }

    console.log('Zap sent successfully:', response)
    return response
  } catch (error) {
    console.error('Error sending zap:', error)
    throw error
  }
}

function waitForResponse(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for NWC response'))
    }, 30000) // 30 seconds timeout

    socket.onmessage = (event) => {
      clearTimeout(timeout)
      const response = JSON.parse(event.data)
      resolve(response)
    }
  })
}

export function disconnectWallet() {
  if (nwcSocket) {
    nwcSocket.close()
  }
  connectedWallet = null
  updateLoginState()
}
