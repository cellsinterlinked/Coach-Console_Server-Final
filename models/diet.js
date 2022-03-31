const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dietSchema = new Schema({
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  dateAdded: { type: Object, required: true },
  weeklyCals: { type: Array, required: true },
  weeklyPro: { type: Array, required: true },
  weeklyFat: { type: Array, required: true },
  weeklyCarb: { type: Array, required: true },
  totalCals: { type: Number, required: true },
  totalPro: { type: Number, required: true },
  totalFat: { type: Number, required: true },
  totalCarb: { type: Number, required: true },
  type: { type: String, required: true },
  food: { type: Array, required: true },
});

module.exports = mongoose.model('Diet', dietSchema);
