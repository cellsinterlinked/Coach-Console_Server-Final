const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
role: { type: String, required: true},
name: { type: String, required: false},
email: { type: String, required: true, unique: true},
password: { type: String, required: true, minlength: 6},
image: { type: String, required: false},
workouts: [{type: mongoose.Types.ObjectId, required: true, ref: 'Workout'}],
diets: [{type: mongoose.Types.ObjectId, required: true, ref: 'Diet'}],
conversations: [{type: mongoose.Types.ObjectId, required: true, ref: 'Convo'}],
clients: [{type: mongoose.Types.ObjectId, required: true, ref: 'User'}],
coach:[{type: mongoose.Types.ObjectId, required: true, ref: 'User'}],
gender:{type: Number, required: false},
//1 male 2 female
age: {type: Number, required: false},
checkins:[{type: mongoose.Types.ObjectId, required: true, ref: 'Checkin'}],
dateJoined: {type: Object, required: true},
code: {type: String, required: true},
notifications: {type: Object, required: true}
})



userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema);