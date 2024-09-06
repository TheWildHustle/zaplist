import { SimplePool, nip19, nip04 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let loggedInUser = null
let zapSendersResults = null
let nwcConnection = null

const defaultAvatar = "https://image.nostr.build/56795451a7e9935992b6078f0ee40ea4b0013f8efdf954fb41a3a6a7c33f25a7.png"
const corsProxy = "https://corsproxy.io/?"

// ... (keep all existing functions)

// Add new NWC-related functions
async function connectNWC() {
  const nwcUriInput = document.getElementById('nwcUriInput')
  const nwcStatus = document.getElementById('nwcStatus')
  const nwcUri = nwcUriInput.value.trim()

  if (!nwcUri) {
    nwcStatus.textContent = 'Please enter a valid NWC URI'
    return
  }

  try {
    const url = new URL(nwcUri)
    const pubkey = url.pathname.slice(1)
    const relay = url.searchParams.get('relay')
    const secret = url.searchParams.get('secret')

    if (!pubkey || !relay || !secret) {
      throw new Error('Invalid NWC URI')
    }

    nwcConnection = { pubkey, relay, secret }
    nwcStatus.textContent = 'Connected to NWC'
    
    // Fetch and display wallet info
    await updateWalletInfo()
  } catch (error) {
    console.error('Error connecting to NWC:', error)
    nwcStatus.textContent = 'Failed to connect to NWC'
  }
}

async function updateWalletInfo() {
  if (!nwcConnection) {
    console.error('No NWC connection')
    return
  }

  try {
    const balance = await getWalletBalance()
    document.getElementById('walletBalance').textContent = balance
    document.getElementById('wallet-info').style.display = 'block'
  } catch (error) {
    console.error('Error updating wallet info:', error)
  }
}

async function getWalletBalance() {
  const event = await createNWCEvent('get_balance', {})
  const response = await sendNWCRequest(event)
  return response.result.balance
}

async function createNWCEvent(method, params) {
  const event = {
    kind: 23194,
    created_at: Math.floor(Date.now() / 1000),
    content: await nip04.encrypt(nwcConnection.secret, JSON.stringify({
      method,
      params
    })),
    tags: [['p', nwcConnection.pubkey]]
  }
  event.id = await window.nostr.signEvent(event)
  return event
}

async function sendNWCRequest(event) {
  return new Promise((resolve, reject) => {
    const sub = pool.sub([nwcConnection.relay], [{
      kinds: [23195],
      '#e': [event.id],
      authors: [nwcConnection.pubkey]
    }])

    sub.on('event', async (response) => {
      try {
        const decrypted = JSON.parse(await nip04.decrypt(nwcConnection.secret, response.content))
        resolve(decrypted)
      } catch (error) {
        reject(error)
      } finally {
        sub.unsub()
      }
    })

    pool.publish([nwcConnection.relay], event)
  })
}

// Modify the fetchZapSenders function to use NWC for sending zaps
async function fetchZapSenders() {
  // ... (keep existing code)

  try {
    myPubkey = convertToHexIfNpub(myPubkey)
    const senderPubkeys = await getZapSenders(myPubkey, relays, startDate, endDate)
    const profiles = await getProfiles(senderPubkeys, relays)

    zapSendersResults = senderPubkeys.map(pubkey => {
      const profile = profiles[pubkey] || {}
      const npub = nip19.npubEncode(pubkey)
      const avatarUrl = profile.avatar || defaultAvatar
      return { npub, name: profile.name || 'Unknown', avatarUrl, pubkey }
    })

    let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">'
    for (const sender of zapSendersResults) {
      resultsHtml += `
      <div style="width: 80px; text-align: center;">
        <a href="https://njump.me/${sender.npub}" target="_blank" style="text-decoration: none; color: inherit;">
          <div class="avatar-container" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${sender.avatarUrl}" alt="${sender.name}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.onerror=null; this.src='${defaultAvatar}';">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sender.name}</p>
        </a>
        <button onclick="sendZap('${sender.pubkey}', 1000)" style="font-size: 10px; padding: 2px 5px;">Zap 1000 sats</button>
      </div>
    `
    }
    resultsHtml += '</div>'

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.'
    downloadImageBtn.style.display = 'inline-block'
    downloadAvatarsBtn.style.display = 'inline-block'
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`
  } finally {
    loadingIndicator.style.display = 'none'
  }
}

async function sendZap(recipientPubkey, amount) {
  if (!nwcConnection) {
    alert('Please connect your wallet using NWC first')
    return
  }

  try {
    const invoice = await createInvoice(recipientPubkey, amount)
    const event = await createNWCEvent('pay_invoice', { invoice })
    const response = await sendNWCRequest(event)

    if (response.error) {
      throw new Error(response.error.message)
    }

    alert(`Zap of ${amount} sats sent successfully!`)
  } catch (error) {
    console.error('Error sending zap:', error)
    alert(`Failed to send zap: ${error.message}`)
  }
}

async function createInvoice(recipientPubkey, amount) {
  // This is a placeholder. In a real-world scenario, you'd need to request an invoice from the recipient's Lightning node.
  // For demonstration purposes, we're creating a dummy invoice here.
  return `lnbc${amount}n1p3...`
}

// Add event listeners
document.getElementById('connectNwcBtn').addEventListener('click', connectNWC)

// ... (keep all existing event listeners)