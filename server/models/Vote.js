import mongoose from 'mongoose'

const voteSchema = new mongoose.Schema({
  choice: {
    type: String,
    enum: ['cat', 'dog'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Vote', voteSchema)
