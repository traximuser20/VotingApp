import { Router } from 'express'
import Vote from '../models/Vote.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const cat = await Vote.countDocuments({ choice: 'cat' })
    const dog = await Vote.countDocuments({ choice: 'dog' })
    res.json({ cat, dog })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch votes' })
  }
})

router.post('/', async (req, res) => {
  const { choice } = req.body

  if (!choice || !['cat', 'dog'].includes(choice)) {
    return res.status(400).json({ error: 'Invalid choice. Must be "cat" or "dog".' })
  }

  try {
    await Vote.create({ choice })
    const cat = await Vote.countDocuments({ choice: 'cat' })
    const dog = await Vote.countDocuments({ choice: 'dog' })
    res.json({ cat, dog })
  } catch (err) {
    console.error('Error recording vote:', err)
    res.status(500).json({ error: 'Failed to record vote' })
  }
})

router.delete('/', async (req, res) => {
  const secret = req.headers['x-delete-secret']

  if (secret !== process.env.DELETE_SECRET) {
    return res.status(403).json({ error: 'Invalid delete secret' })
  }

  try {
    await Vote.deleteMany({})
    res.json({ cat: 0, dog: 0 })
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset votes' })
  }
})

export default router
