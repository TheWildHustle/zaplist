const express = require('express')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { createZapRequest, createZapReceipt, verifyZapRequest, verifyZapReceipt, generateZapInvoice } = require('./src/nostr/nip57')
const { getLightningAddress } = require('./src/nostr/profileUtils')
const app = express()

// ... (keep existing code)

// New endpoint to get lightning address
app.get('/get-lightning-address/:pubkey', async (req, res) => {
  const { pubkey } = req.params;
  try {
    const lightningAddress = await getLightningAddress(pubkey);
    if (lightningAddress) {
      res.json({ lightningAddress });
    } else {
      res.status(404).send('Lightning address not found');
    }
  } catch (error) {
    console.error('Failed to fetch lightning address:', error);
    res.status(500).send('Failed to fetch lightning address');
  }
});

// ... (keep existing code)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})