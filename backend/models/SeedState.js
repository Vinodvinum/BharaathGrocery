const mongoose = require('mongoose');

const seedStateSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  seeded: {
    type: Boolean,
    default: false
  },
  seededAt: Date,
  seededByCommit: String,
  note: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SeedState', seedStateSchema);
