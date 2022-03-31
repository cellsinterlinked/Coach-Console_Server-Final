const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const req = require('express/lib/request');
const Convo = require('../models/convo')
const cloudinary = require('cloudinary').v2;




const getConvos = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed. Make sure all inputs have been filled out.', 422)
      )
  }

  const userId = req.params.uid
  const {role} = req.body
  let allConvos;
  let convos;


  try {
    allConvos = await Convo.find()
  } catch (err) {
    const error = new HttpError('Could not fetch convos', 500)
    return next(error)
  }

  //check if token is of this user

  convos = allConvos.filter(c => c[role] !== userId)



  res.json({convos: convos.map(c => c.toObject({getters: true}))})

}

const updateAddConvo = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed. Make sure all inputs have been filled out.', 422)
      )
  }
  const userId = req.params.uid
  const {convoId, role, message, image} = req.body
// deal with cloudinary image later

  let convo;

  try {
    convo = await Convo.findById(convoId)
  } catch(err) {
    const error = new HttpError('Something went wrong, cant find this convo', 500)
    return next(error);
  }

  let newImage;
  // for cloudinary link


const monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const today = new Date()
const month = today.getMonth() + 1
const day = today.getDate()
const year = today.getFullYear()
const codeTime = today.getTime()
const stringMonth = monthArray[month - 1]

//check if token id is the actual role and id of someone in the conversation

convo.messages= [...convo.messages, {message: message, user: userId, date: {fullDate: today, month: month, day: day, year: year, time:codeTime, monthString: stringMonth}, image: newImage }]
if (role === 'client') {
  convo.coachNotifications = convo.coachNotifications + 1
}

if (role === 'coach') {
  convo.clientNotifications = convo.clientNotifications + 1
}

try {
  await convo.save();
} catch(err) {
  const error = new HttpError('sending this message did not work.', 500)
  return next(error)
}

res.status(200).json({convo: convo.toObject({ getters: true})})

}








const updateDeleteConvo = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed. Make sure all inputs have been filled out.', 422)
      )
  }
  const userId = req.params.uid
  const {convoId, messageIndex} = req.body
  let convo;

  try {
    convo = await Convo.findById(convoId)
  } catch(err) {
    const error = new HttpError('Something went wrong, cant find this convo', 500)
    return next(error);
  }

  //check if user of message is that of the token given

  if (userId !== convo.messages[messageIndex].user) {
    return next( new HttpError('You cant delete a message that isnt yours', 500))
  }

  convo.messages.splice(messageIndex, 1)

  try {
    await convo.save();
  } catch(err) {
    const error = new HttpError('sending this message did not work.', 500)
    return next(error)
  }

  res.status(200).json({convo: convo.toObject({ getters: true})})




}


const updateConvoNotifications = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed. Make sure all inputs have been filled out.', 422)
      )
  }
  const userId = req.params.uid
  const {role, convoId} = req.body;
  let convo;

  try {
    convo = await Convo.findById(convoId)
  } catch(err) {
    const error = new HttpError('Something went wrong, cant find this convo', 500)
    return next(error);
  }

  //check if token id is that of owner of conversation

  if (role === 'client') {
    convo.clientNotifications = 0;
  }

  if (role === 'coach') {
    convo.coachNotifications = 0;
  }

  try {
    await convo.save();
  } catch(err) {
    const error = new HttpError('sending this message did not work.', 500)
    return next(error)
  }

  res.status(200).json({convo: convo.toObject({ getters: true})})


}
exports.updateDeleteConvo = updateDeleteConvo;
exports.updateConvoNotifications = updateConvoNotifications;
exports.getConvos = getConvos
exports.updateAddConvo = updateAddConvo