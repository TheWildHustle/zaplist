import { useEffect, useState } from 'react';
import NDK from '@nostr-dev-kit/ndk';

export function useNdk() {
  const [ndk, setNdk] = useState(null);
  const [keyPair, setKeyPair] = useState({ privateKey: '', publicKey: '' });

  useEffect(() => {
    const initNdk = async () => {
      const newNdk = new NDK();
      await newNdk.connect();
      setNdk(newNdk);

      // Generate a new key pair
      const privateKey = NDK.generatePrivateKey();
      const publicKey = NDK.getPublicKey(privateKey);
      setKeyPair({ privateKey, publicKey });
    };

    initNdk();
  }, []);

  const subscribeAndHandle = (filter, handler, options = {}) => {
    if (!ndk) return;
    const subscription = ndk.subscribe(filter, options);
    subscription.on('event', handler);
    return subscription;
  };

  return { ndk, keyPair, subscribeAndHandle };
}