const { SimplePool } = require('nostr-tools');

const pool = new SimplePool();

async function fetchNostrProfile(pubkey) {
  const events = await pool.list([{
    kinds: [0],
    authors: [pubkey],
  }]);

  if (events.length === 0) {
    return null;
  }

  const profileEvent = events[0];
  let profile;
  try {
    profile = JSON.parse(profileEvent.content);
  } catch (e) {
    console.error('Error parsing profile content:', e);
    return null;
  }

  return profile;
}

async function getLightningAddress(pubkey) {
  const profile = await fetchNostrProfile(pubkey);
  if (!profile) {
    return null;
  }
  return profile.lud16 || profile.lud06 || null;
}

module.exports = {
  fetchNostrProfile,
  getLightningAddress,
};