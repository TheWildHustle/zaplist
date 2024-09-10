import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'
import { nip47 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let loggedInUser = null
let zapSendersResults = null
let nwcConnection = null

const defaultAvatar = "https://image.nostr.build/56795451a7e9935992b6078f0ee40ea4b0013f8efdf954fb41a3a6a7c33f25a7.png"
const corsProxy = "https://corsproxy.io/?"

// ... (keep all existing functions) ...

async function connectNWC() {
  const connectionUri = await promptForNWCUri()
  if (!connectionUri) return

  try {
    const parsedUri = nip47.parseConnectionString(connectionUri)
    nwcConnection = parsedUri
    updateNWCStatus(true)
    alert('Wallet connected successfully!')
  } catch (error) {
    console.error('Error connecting wallet:', error)
    alert('Failed to connect wallet. Please check the URI and try again.')
  }
}

function promptForNWCUri() {
  return new Promise((resolve) => {
    Swal.fire({
      title: 'Connect Wallet',
      input: 'text',
      inputPlaceholder: 'nostr+walletconnect://...',
      showCancelButton: true,
      confirmButtonText: 'Connect',
      background: '#333',
      color: '#fff',
      customClass: {
        input: 'swal-input-dark'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a URI!'
        }
      },
      didOpen: () => {
        const input = Swal.getInput()
        input.style.color = '#fff'
        input.style.backgroundColor = '#555'
        input.style.border = '1px solid #777'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        resolve(result.value)
      } else {
        resolve(null)
      }
    })
  })
}

function updateNWCStatus(isConnected) {
  const nwcStatus = document.getElementById('nwcStatus')
  const connectWalletBtn = document.getElementById('connectWalletBtn')
  const disconnectWalletBtn = document.getElementById('disconnectWalletBtn')

  if (isConnected) {
    nwcStatus.textContent = 'Wallet Connected'
    nwcStatus.style.display = 'block'
    connectWalletBtn.style.display = 'none'
    disconnectWalletBtn.style.display = 'inline-block'
  } else {
    nwcStatus.style.display = 'none'
    connectWalletBtn.style.display = 'inline-block'
    disconnectWalletBtn.style.display = 'none'
  }
}

function disconnectNWC() {
  nwcConnection = null
  updateNWCStatus(false)
  alert('Wallet disconnected')
}

// ... (keep all existing code) ...

// Add event listeners to the buttons
document.getElementById('downloadHtmlBtn').addEventListener('click', downloadHtmlResult)
document.getElementById('downloadImageBtn').addEventListener('click', downloadImageResult)
document.getElementById('downloadAvatarsBtn').addEventListener('click', downloadAvatars)
document.getElementById('fetchButton').addEventListener('click', fetchZapSenders)
document.getElementById('loginBtn').addEventListener('click', login)
document.getElementById('logoutBtn').addEventListener('click', logout)
document.getElementById('connectWalletBtn').addEventListener('click', connectNWC)
document.getElementById('disconnectWalletBtn').addEventListener('click', disconnectNWC)

// Initialize login state
updateLoginState()
updateNWCStatus(false)

// Add this style to the document head
const style = document.createElement('style')
style.textContent = `
  .swal-input-dark {
    width: 100% !important;
    color: #fff !important;
    background-color: #555 !important;
    border: 1px solid #777 !important;
  }
`
document.head.appendChild(style)