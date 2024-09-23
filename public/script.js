// ... (keep existing imports and code)

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
        <button class="zap-back-button" onclick="zapBack('${sender.npub}', '${sender.name}')">Zap Back</button>
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

// Add this new function for zapping back
async function zapBack(pubkey, name) {
  const lastZap = getLastZapFromUser(pubkey);
  if (lastZap) {
    showZapModal(pubkey, name, lastZap.amount);
  } else {
    alert('No previous zap found from this user.');
  }
}

function getLastZapFromUser(pubkey) {
  const zapHistory = JSON.parse(localStorage.getItem('zapHistory') || '[]');
  return zapHistory.find(zap => zap.recipient === pubkey && zap.type === 'received');
}

// ... (keep existing code and event listeners)