import { SimplePool, nip19, generatePrivateKey, getPublicKey, getEventHash, signEvent } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let loggedInUser = null
let zapSendersResults = null

const defaultAvatar = "https://image.nostr.build/56795451a7e9935992b6078f0ee40ea4b0013f8efdf954fb41a3a6a7c33f25a7.png"
const corsProxy = "https://corsproxy.io/?"

// ... (keep all existing functions)

async function connectWallet() {
  if (typeof window.nostr !== 'undefined') {
    try {
      const pubkey = await window.nostr.getPublicKey()
      loggedInUser = pubkey
      updateLoginState()
      document.getElementById('pubkeyInput').value = pubkey
      await fetchUserProfile(pubkey)
      document.getElementById('walletStatus').textContent = 'Connected (Extension)'
      document.getElementById('signMessageSection').style.display = 'block'
    } catch (error) {
      console.error('Error connecting to Nostr extension:', error)
      alert('Failed to connect to Nostr extension. Falling back to in-browser wallet.')
      createInBrowserWallet()
    }
  } else {
    alert('Nostr extension not found. Creating in-browser wallet.')
    createInBrowserWallet()
  }
}

function createInBrowserWallet() {
  const privateKey = generatePrivateKey()
  const pubkey = getPublicKey(privateKey)
  loggedInUser = pubkey
  updateLoginState()
  document.getElementById('pubkeyInput').value = pubkey
  fetchUserProfile(pubkey)
  document.getElementById('walletStatus').textContent = 'Connected (In-browser)'
  document.getElementById('signMessageSection').style.display = 'block'

  // Store the private key securely (this is just for demonstration, not recommended for production)
  sessionStorage.setItem('nostr_private_key', privateKey)
}

async function signMessage() {
  if (!loggedInUser) {
    alert('Please connect your wallet first.')
    return
  }

  const message = document.getElementById('messageToSign').value
  if (!message) {
    alert('Please enter a message to sign.')
    return
  }

  try {
    let signature
    if (typeof window.nostr !== 'undefined') {
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: message
      }
      signature = await window.nostr.signEvent(event)
    } else {
      const privateKey = sessionStorage.getItem('nostr_private_key')
      if (!privateKey) {
        throw new Error('Private key not found')
      }
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: message,
        pubkey: loggedInUser
      }
      event.id = getEventHash(event)
      signature = signEvent(event, privateKey)
    }
    document.getElementById('signedMessage').textContent = `Signature: ${signature}`
  } catch (error) {
    console.error('Error signing message:', error)
    alert('Failed to sign message. Please try again.')
  }
}

// ... (keep all existing event listeners)

// Add new event listeners for wallet connect and sign message
document.getElementById('connectWalletBtn').addEventListener('click', connectWallet)
document.getElementById('signMessageBtn').addEventListener('click', signMessage)

// Initialize login state
updateLoginState()