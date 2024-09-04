const express = require('express')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const next = require('next')
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  const app = express()

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

  // Handle all other routes with Next.js
  app.all('*', (req, res) => {
    return handle(req, res)
  })

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
})