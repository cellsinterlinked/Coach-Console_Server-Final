const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const convoSchema = new Schema({
  coach: { type: mongoose.Types.ObjectId, required: true, ref: 'User'},
  client: { type: mongoose.Types.ObjectId, required: true, ref: 'User'},
  messages: {type: Array, required: true},
  clientNotifications: {type: Number, required: true},
  coachNotifications: {type: Number, required: true}

})

module.exports = mongoose.model('Convo', convoSchema)