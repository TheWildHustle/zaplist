import React, { useState } from 'react';
import { generatePrivateKey, getPublicKey, nip04 } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';

const NWCButton = () => {
  const [connectionUri, setConnectionUri] = useState('');
  const [walletResponse, setWalletResponse] = useState(null);

  const handleNWCClick = () => {
    // Generate a random secret
    const secret = generatePrivateKey();

    // Your app's public key
    const appPubkey = getPublicKey(generatePrivateKey());

    // Create the connection URI
    const relayUrl = 'wss://your-relay.com'; // Replace with your actual relay URL
    const uri = `nostrwalletconnect://${appPubkey}?secret=${secret}&relay=${encodeURIComponent(relayUrl)}`;
    setConnectionUri(uri);

    // Listen for the response
    const pool = new SimplePool();
    pool.sub([relayUrl], [
      {
        kinds: [23194],
        authors: [appPubkey],
        since: Math.floor(Date.now() / 1000)
      }
    ], (event) => {
      if (event.kind === 23194) {
        const decrypted = nip04.decrypt(secret, event.pubkey, event.content);
        const response = JSON.parse(decrypted);
        setWalletResponse(response);
        console.log('Connected to wallet:', response);
      }
    });
  };

  const handleUriInput = (e) => {
    setConnectionUri(e.target.value);
  };

  return (
    <div>
      <button onClick={handleNWCClick}>NWC</button>
      <input
        type="text"
        value={connectionUri}
        onChange={handleUriInput}
        placeholder="Enter NWC URI"
      />
      {walletResponse && (
        <div>
          <h3>Wallet Response:</h3>
          <pre>{JSON.stringify(walletResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default NWCButton;