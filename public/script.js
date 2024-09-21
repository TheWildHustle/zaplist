import { SimplePool, nip19, generatePrivateKey, getPublicKey, nip04 } from 'https://esm.sh/nostr-tools@1.17.0'
import NDK from 'https://esm.sh/@nostr-dev-kit/ndk@1.4.2'
import { init, requestProvider, launchModal, disconnect } from 'https://esm.sh/@getalby/bitcoin-connect@3.6.2';

const style = document.createElement('style')
style.textContent = `
  .swal-input-dark {
    width: 100% !important;
    color: #fff !important;
    background-color: #555 !important;
    border: 1px solid #777 !important;
  }
`

document.addEventListener('DOMContentLoaded', () => {
  init({
      appName: 'zaplist',
      filters: ["nwc"],
  });

  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  const userBanner = document.getElementById('userBanner');

  connectWalletBtn.addEventListener('click', async () => {
      try {
          const provider = await requestProvider();
          const info = await provider.getInfo();
          console.log('Connected to wallet:', info);
          updateUIAfterConnection(info);
      } catch (error) {
          console.error('Failed to connect wallet:', error);
      }
  });

  loginBtn.addEventListener('click', () => {
      launchModal();
  });

  logoutBtn.addEventListener('click', async () => {
      try {
          await disconnect();
          updateUIAfterDisconnection();
      } catch (error) {
          console.error('Failed to disconnect:', error);
      }
  });

  function updateUIAfterConnection(info) {
      connectWalletBtn.style.display = 'block';
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'block';
      userProfile.style.display = 'block';
      userName.textContent = info.alias || 'Anonymous';
      userAvatar.src = info.avatar || 'https://via.placeholder.com/100';
      userBanner.src = info.banner || 'https://via.placeholder.com/500x200';
  }

  function updateUIAfterDisconnection() {
      connectWalletBtn.style.display = 'block';
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      userProfile.style.display = 'none';
  }
});

document.head.appendChild(style)

const pool = new SimplePool()

let loggedInUser = null
let zapSendersResults = null
let nwcConnection = null

const defaultAvatar = "https://image.nostr.build/56795451a7e9935992b6078f0ee40ea4b0013f8efdf954fb41a3a6a7c33f25a7.png"
const corsProxy = "https://corsproxy.io/?"

async function connectNWC() {
  const connectionUri = await promptForNWCUri()
  if (!connectionUri) return

  try {
    const parsedUri = new URL(connectionUri)
    const walletPubkey = parsedUri.host
    const secret = parsedUri.searchParams.get('secret')
    const relay = parsedUri.searchParams.get('relay')

    if (!walletPubkey || !secret || !relay) {
      throw new Error('Invalid NWC URI')
    }

    nwcConnection = { walletPubkey, secret, relay }
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

function convertToHexIfNpub(pubkey) {
  if (pubkey.startsWith('npub')) {
    try {
      const { type, data } = nip19.decode(pubkey)
      if (type === 'npub') {
        return data
      }
    } catch (error) {
      throw new Error('Invalid npub')
    }
  }
  return pubkey
}

async function getZapSenders(recipientPubkey, relays, startDate, endDate) {
  const sinceTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
  const untilTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
  
  const zapReceipts = await pool.list(relays, [
    {
      kinds: [9735],
      '#p': [recipientPubkey],
      since: sinceTimestamp,
      until: untilTimestamp
    }
  ])

  const senderPubkeys = new Set()
  
  zapReceipts.forEach(receipt => {
    const senderTag = receipt.tags.find(tag => tag[0] === 'P')
    if (senderTag) {
      senderPubkeys.add(senderTag[1])
    }
  })

  return Array.from(senderPubkeys)
}

async function getProfiles(pubkeys, relays) {
  const profiles = await pool.list(relays, [
    {
      kinds: [0],
      authors: pubkeys
    }
  ])

  return profiles.reduce((acc, profile) => {
    const content = JSON.parse(profile.content)
    acc[profile.pubkey] = {
      name: content.name,
      avatar: content.picture,
      banner: content.banner
    }
    return acc
  }, {})
}

async function fetchZapSenders() {
  const pubkeyInput = document.getElementById('pubkeyInput')
  const relaysInput = document.getElementById('relaysInput')
  const dateRangeInput = document.getElementById('dateRangeInput')
  const resultsDiv = document.getElementById('results')
  const downloadImageBtn = document.getElementById('downloadImageBtn')
  const downloadAvatarsBtn = document.getElementById('downloadAvatarsBtn')
  const loadingIndicator = document.getElementById('loadingIndicator')
  
  let myPubkey = pubkeyInput.value.trim()
  const relays = relaysInput.value.split(',').map(relay => relay.trim())
  const [startDate, endDate] = dateRangeInput.value.split(' to ')

  resultsDiv.innerHTML = ''
  loadingIndicator.style.display = 'block'

  try {
    myPubkey = convertToHexIfNpub(myPubkey)
    const senderPubkeys = await getZapSenders(myPubkey, relays, startDate, endDate)
    const profiles = await getProfiles(senderPubkeys, relays)

    zapSendersResults = senderPubkeys.map(pubkey => {
      const profile = profiles[pubkey] || {}
      const npub = nip19.npubEncode(pubkey)
      const avatarUrl = profile.avatar || defaultAvatar
      return { npub, name: profile.name || 'Unknown', avatarUrl }
    })

    let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">'
    for (const sender of zapSendersResults) {
      resultsHtml += `
      <a href="https://njump.me/${sender.npub}" target="_blank" style="text-decoration: none; color: inherit;">
        <div style="width: 80px; text-align: center;">
          <div class="avatar-container" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${sender.avatarUrl}" alt="${sender.name}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.onerror=null; this.src='${defaultAvatar}';">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sender.name}</p>
        </div>
      </a>
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

async function downloadImageResult() {
  try {
    const resultDiv = document.getElementById('results');
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    
    // Create a container for the snapshot
    const snapshotContainer = document.createElement('div');
    snapshotContainer.style.position = 'absolute';
    snapshotContainer.style.left = '-9999px';
    snapshotContainer.style.width = resultDiv.offsetWidth + 'px';
    snapshotContainer.style.backgroundColor = '#333333';
    snapshotContainer.style.padding = '20px';
    document.body.appendChild(snapshotContainer);

    // Create content with loaded images
    let contentHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
    
    // Function to load image with fallback
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          img.src = defaultAvatar;
          img.onload = () => resolve(img);
        };
        img.src = src;
      });
    };

    // Load all images first
    const loadedImages = await Promise.all(zapSendersResults.map(sender => loadImage(sender.avatarUrl)));

    // Create HTML content with loaded images
    zapSendersResults.forEach((sender, index) => {
      contentHtml += `
        <div style="width: 80px; text-align: center;">
          <div class="avatar-container" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${loadedImages[index].src}" alt="${sender.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: white;">${sender.name}</p>
        </div>
      `;
    });
    contentHtml += '</div>';

    snapshotContainer.innerHTML = contentHtml;

    // Ensure all images are fully loaded
    await Promise.all(Array.from(snapshotContainer.getElementsByTagName('img')).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = () => {
            img.src = defaultAvatar;
            img.onload = resolve;
          };
        }
      });
    }));

    // Capture the snapshot
    const canvas = await html2canvas(snapshotContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#333333',
      width: resultDiv.offsetWidth,
      height: snapshotContainer.offsetHeight,
      scale: 2,
      logging: true, // Enable logging for debugging
    });

    // Remove the temporary container
    document.body.removeChild(snapshotContainer);

    // Create download link
    const link = document.createElement('a');
    link.download = 'zaplist_result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error("Error: ", err);
    alert("An error occurred while generating the image. Please try again.");
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

async function downloadAvatars() {
  const loadingIndicator = document.getElementById('loadingIndicator')
  loadingIndicator.style.display = 'block'

  const zip = new JSZip()
  const avatarPromises = zapSendersResults.map(async (sender, index) => {
    try {
      const response = await fetch(corsProxy + encodeURIComponent(sender.avatarUrl))
      const blob = await response.blob()
      const fileName = `avatar_${index + 1}.${blob.type.split('/')[1]}`
      zip.file(fileName, blob)
    } catch (error) {
      console.error(`Failed to download avatar for ${sender.name}:`, error)
    }
  })

  await Promise.all(avatarPromises)

  const content = await zip.generateAsync({ type: "blob" })
  saveAs(content, "zap_senders_avatars.zip")
  loadingIndicator.style.display = 'none'
}

async function downloadHtmlResult() {
  if (!zapSendersResults) {
    alert('No results to download. Please fetch zap senders first.');
    return;
  }

  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.style.display = 'block';

  try {
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zap Senders Result</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #333333;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #222222;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }
        .avatar {
          width: 80px;
          text-align: center;
        }
        .avatar-container {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
        }
        .avatar-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar p {
          margin: 5px 0;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="grid">
    `;

    for (const sender of zapSendersResults) {
      try {
        const response = await fetch(corsProxy + encodeURIComponent(sender.avatarUrl));
        const blob = await response.blob();
        const base64data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        htmlContent += `
          <div class="avatar">
            <div class="avatar-container">
              <img src="${base64data}" alt="${sender.name}" onerror="this.onerror=null; this.src='${defaultAvatar}';">
            </div>
            <p>${sender.name}</p>
          </div>
        `;
      } catch (error) {
        console.error(`Failed to fetch avatar for ${sender.name}:`, error);
        htmlContent += `
          <div class="avatar">
            <div class="avatar-container">
              <img src="${defaultAvatar}" alt="${sender.name}">
            </div>
            <p>${sender.name}</p>
          </div>
        `;
      }
    }

    htmlContent += `
        </div>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'zaplist_result.html';
    link.click();
  } catch (error) {
    console.error("Error generating HTML result:", error);
    alert("An error occurred while generating the HTML result. Please try again.");
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

async function login() {
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
  } catch (error) {
    console.error('Error during login:', error)
    alert('Failed to login. Please try again.')
  }
}

function logout() {
  loggedInUser = null
  updateLoginState()
  document.getElementById('pubkeyInput').value = ''
  document.getElementById('userProfile').style.display = 'none'
  document.getElementById('pubkeyInputContainer').style.display = 'block'
  document.body.style.backgroundImage = 'none'
}

async function fetchUserProfile(pubkey) {
  const relays = document.getElementById('relaysInput').value.split(',').map(relay => relay.trim())
  const profiles = await getProfiles([pubkey], relays)
  const profile = profiles[pubkey] || {}

  const npub = nip19.npubEncode(pubkey)
  const avatarUrl = profile.avatar || ''

  document.getElementById('userBanner').src = profile.banner || ''
  document.getElementById('userAvatar').src = avatarUrl
  document.getElementById('userName').textContent = profile.name || 'Unknown'
  document.getElementById('userProfile').style.display = 'block'
  document.getElementById('pubkeyInputContainer').style.display = 'none'

 
}

function updateLoginState() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  const zapLink = document.getElementById('zap')

  if (loggedInUser) {
    loginBtn.style.display = 'none'
    logoutBtn.style.display = 'inline-block'
    zapLink.innerHTML = '⚡️ Zap'
  } else {
    loginBtn.style.display = 'inline-block'
    logoutBtn.style.display = 'none'
    zapLink.innerHTML = '⚡️ Zap'
  }
}

// Initialize Flatpickr
flatpickr("#dateRangeInput", {
  mode: "range",
  dateFormat: "Y-m-d",
  defaultDate: [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date()],
})

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
