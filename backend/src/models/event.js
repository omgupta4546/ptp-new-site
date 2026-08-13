const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true }, // name of event
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  expertName: { type: String, required: true },
  topic: { type: String, required: true },
  status: { type: String, enum: ['pending', 'open', 'closed'], default: 'pending' },
  token: { type: String }, // volunteer link token, generated when attendance starts
  createdBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
