import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let loggedInUser = null
let zapSendersResults = null

const defaultAvatar = "https://image.nostr.build/56795451a7e9935992b6078f0ee40ea4b0013f8efdf954fb41a3a6a7c33f25a7.png"
const corsProxy = "https://corsproxy.io/?"

// ... (keep all existing functions)

async function connectWallet() {
  if (typeof window.nostr === 'undefined') {
    alert('Nostr extension not found. Please install a Nostr-compatible browser extension.')
    return
  }

  try {
    const pubkey = await window.nostr.getPublicKey()
    loggedInUser = pubkey
    updateLoginState()
    document.getElementById('pubkeyInput').value = pubkey
    await fetchUserProfile(pubkey)
    document.getElementById('walletStatus').textContent = 'Connected'
    document.getElementById('signMessageSection').style.display = 'block'
  } catch (error) {
    console.error('Error connecting wallet:', error)
    alert('Failed to connect wallet. Please try again.')
  }
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
    const signature = await window.nostr.signEvent({
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: message
    })
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