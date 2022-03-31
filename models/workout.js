const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  name: {type: String, required: true},
  description: {type: String, required: true},
  dateAdded: {type: Object, required: true},
  totalSets: {type: Number, required: true},
  cardioTime: {type: Number, required: false},
  cardioCals: {type: Number, required: false},
  weightData: {type: Array, required: true},
  cardioData: {type: Object, required: false},
});

module.exports = mongoose.model('Workout', workoutSchema);