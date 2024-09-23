const express = require('express')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { createZapRequest, createZapReceipt, verifyZapRequest, verifyZapReceipt, generateZapInvoice } = require('./src/nostr/nip57')
const app = express()

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })

app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json({ limit: '50mb' })) // Increase the limit if necessary

// Function to convert image to PNG format
const convertToPNG = async (buffer) => {
  return await sharp(buffer)
    .png()
    .toBuffer()
}

app.post('/save-image', async (req, res) => {
  const { filePath, buffer, pubkey } = req.body
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  try {
    const pngBuffer = await convertToPNG(Buffer.from(buffer))
    const pngFilePath = filePath.replace(/\.[^/.]+$/, ".png")

    fs.writeFile(pngFilePath, pngBuffer, (err) => {
      if (err) {
        console.error(`Failed to save image for ${pubkey}:`, err)
        return res.status(500).send('Failed to save image')
      }

      res.send('Image saved successfully as PNG')
    })
  } catch (error) {
    console.error(`Failed to convert image for ${pubkey}:`, error)
    res.status(500).send('Failed to convert and save image')
  }
})

app.use('/imgstash', express.static(path.join(__dirname, 'imgstash')))

// New endpoints for NIP 57 Zaps

app.post('/create-zap-request', (req, res) => {
  const { recipientPubkey, amount, content, privateKey } = req.body
  try {
    const zapRequest = createZapRequest(recipientPubkey, amount, content, privateKey)
    res.json(zapRequest)
  } catch (error) {
    console.error('Failed to create zap request:', error)
    res.status(500).send('Failed to create zap request')
  }
})

app.post('/create-zap-receipt', (req, res) => {
  const { zapRequest, preimage, privateKey } = req.body
  try {
    const zapReceipt = createZapReceipt(zapRequest, preimage, privateKey)
    res.json(zapReceipt)
  } catch (error) {
    console.error('Failed to create zap receipt:', error)
    res.status(500).send('Failed to create zap receipt')
  }
})

app.post('/verify-zap-request', (req, res) => {
  const { zapRequest } = req.body
  try {
    const isValid = verifyZapRequest(zapRequest)
    res.json({ isValid })
  } catch (error) {
    console.error('Failed to verify zap request:', error)
    res.status(500).send('Failed to verify zap request')
  }
})

app.post('/verify-zap-receipt', (req, res) => {
  const { zapReceipt, zapRequest } = req.body
  try {
    const isValid = verifyZapReceipt(zapReceipt, zapRequest)
    res.json({ isValid })
  } catch (error) {
    console.error('Failed to verify zap receipt:', error)
    res.status(500).send('Failed to verify zap receipt')
  }
})

app.post('/generate-zap-invoice', async (req, res) => {
  const { amount, description } = req.body
  try {
    const invoice = await generateZapInvoice(amount, description)
    res.json({ invoice })
  } catch (error) {
    console.error('Failed to generate zap invoice:', error)
    res.status(500).send('Failed to generate zap invoice')
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})