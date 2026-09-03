import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import votesRouter from './routes/votes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

app.use('/api/votes', votesRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables')
  process.exit(1)
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
