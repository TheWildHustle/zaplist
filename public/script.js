import { SimplePool, nip19, generatePrivateKey, getPublicKey, nip04 } from 'https://esm.sh/nostr-tools@1.17.0'
import NDK from 'https://esm.sh/@nostr-dev-kit/ndk@1.4.2'
import { init, requestProvider, launchModal, disconnect } from 'https://esm.sh/@getalby/bitcoin-connect@3.6.2';

// ... (keep existing code)

async function fetchZapSenders() {
  // ... (keep existing code)

  try {
    // ... (keep existing code)

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
        <button class="zap-button" onclick="showZapModal('${sender.npub}', '${sender.name}')">Zap</button>
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

// ... (keep existing code)

// Add event listeners to the buttons
document.getElementById('downloadHtmlBtn').addEventListener('click', downloadHtmlResult)
document.getElementById('downloadImageBtn').addEventListener('click', downloadImageResult)
document.getElementById('downloadAvatarsBtn').addEventListener('click', downloadAvatars)
document.getElementById('fetchButton').addEventListener('click', fetchZapSenders)
document.getElementById('loginBtn').addEventListener('click', login)
document.getElementById('logoutBtn').addEventListener('click', logout)
document.getElementById('connectWalletBtn').addEventListener('click', connectNWC)
document.getElementById('disconnectWalletBtn').addEventListener('click', disconnectNWC)

// Initialize WebLN
if (typeof window.webln !== 'undefined') {
  window.webln.enable().catch(console.error);
}