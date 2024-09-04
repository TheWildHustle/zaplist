import { useCallback } from 'react';
import NDK from '@nostr-dev-kit/ndk';

export default function useNwc({ ndk, privateKey, publicKey }) {
  const generateNwcUri = useCallback(({ budgetSat, expiryUnix }) => {
    const nwcUri = new URL('nostr+walletconnect://');
    nwcUri.searchParams.set('relay', 'wss://relay.damus.io');
    nwcUri.searchParams.set('pubkey', publicKey);
    if (budgetSat) nwcUri.searchParams.set('amount', budgetSat.toString());
    if (expiryUnix) nwcUri.searchParams.set('expiry', expiryUnix.toString());
    return nwcUri.toString();
  }, [publicKey]);

  const handleNwcRequest = useCallback(async (event) => {
    console.log('Received NWC request:', event);
    // Here you would implement the logic to handle the NWC request
    // This could include verifying the request, processing payments, etc.
  }, [ndk, privateKey]);

  return { generateNwcUri, handleNwcRequest };
}