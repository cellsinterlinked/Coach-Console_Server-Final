const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const checkinSchema = new Schema({
  date: {type: Object, required: true},
  client: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  coach: {type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  workout: {type: mongoose.Types.ObjectId, required: false, ref: 'Workout'},
  diet: {type: mongoose.Types.ObjectId, required: false, ref: 'Diet'},
  bfTotal: {type: Number, required: false},
  leanBodyMass: {type: Number, required: false},
  fatMass: {type: Number, required: false},
  sleepTotal: {type: Number, required: false},
  sleepAvg: {type: Number, required: false},
  avgWorkoutQuality: {type: Number, required: false},
  measurementTotal: {type: Number, required: false},
  weight: {type: Number, required: false},
  notified: {type: Boolean, required: true},
  bfChest: {type: Number, required: false},
  bfAxilla: {type: Number, required: false},
  bfTricep: {type: Number, required: false},
  bfSubscapular: {type: Number, required: false},
  bfAbdominal: {type: Number, required: false},
  bfSuprailiac: {type: Number, required: false},
  bfThigh: {type: Number, required: false},
  images: {type: Array, required: false},
  neck: {type: Number, required: false},
  bicep: {type: Number, required: false},
  forearm: {type: Number, required: false},
  chest: {type: Number, required: false},
  waist: {type: Number, required: false},
  hips: {type: Number, required: false},
  thigh: {type: Number, required: false},
  calf: {type: Number, required: false},
  monSleep: {type: Number, required: false},
  tueSleep: {type: Number, required: false},
  wedSleep: {type: Number, required: false},
  thuSleep: {type: Number, required: false},
  friSleep: {type: Number, required: false},
  satSleep: {type: Number, required: false},
  sunSleep: {type: Number, required: false},
  workoutQuality: {type: Array, required: false},
  notes: {type: String, required: false},
  weekCals: {type: Array, required: false},
  weekPro: {type: Array, required: false},
  weekFat: {type: Array, required: false},
  weekCarb: {type: Array, required: false},
  totalCals: {type: Number, required: false},
  totalCarb: {type: Number, required: false},
  totalPro: {type: Number, required: false},
  totalFat: {type: Number, required: false},
  totalSets: {type: Number, required: false},
  cardioTime: {type: Number, required: false},
  cardioCals: {type: Number, required: false}
});
module.exports = mongoose.model('Checkin', checkinSchema);




