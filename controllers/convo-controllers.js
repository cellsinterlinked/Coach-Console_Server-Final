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

    return next(
      new HttpError('Invalid inputs passed. Make sure all inputs have been filled out.', 422)
      )
  }

  const userId = req.params.uid
  // const { role } = req.body


  let user
  try {
    user = await User.findById(userId)
  } catch (err) {
    const error = new HttpError('Could not fetch user', 500)
    return next(error)
  }

  let role = user.role;

  let convos;



  if (role ==='client') {
    try {
      convos = await Convo.find({ client: userId})
    } catch (err) {
      const error = new HttpError('Could not fetch convos', 500)
      return next(error)
    }

  }

  if (role ==='coach') {
    try {
      convos = await Convo.find({ coach: userId})
    } catch (err) {
      const error = new HttpError('Could not fetch convos', 500)
      return next(error)
    }

  }





  if (!convos) {
    const error = new HttpError('No convos with this user id', 500)
    return next(error)
  }
  res.json({convos: convos.map(c => c.toObject({getters: true}))})

}





const updateAddConvo = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {

    return next(
      new HttpError('Invalid inputs passed. Make sure all inputs have been filled out.', 422)
      )
  }
  const userId = req.params.uid
  const {convoId, role, message, image} = req.body
// deal with cloudinary image later

  let convo;
  let coach;
  let client

  try {
    convo = await Convo.findById(convoId)
  } catch(err) {
    const error = new HttpError('Something went wrong, cant find this convo', 500)
    return next(error);
  }

  try {
    coach = await User.findById(convo.coach)
  }catch(err) {
    const error = new HttpError('Something went wrong, cant find this user', 500)
    return next(error);
  }

  try {
    client = await User.findById(convo.client)
  }catch(err) {
    const error = new HttpError('Something went wrong, cant find this user', 500)
    return next(error);
  }

  let imageUrl;

  let uploadedResponse;
  if (image) {
    try {
      uploadedResponse = await cloudinary.uploader.upload(image, {
        upload_preset: 'coach-production',
      });

    } catch (err) {
      const error = new HttpError(
        'Couldnt upload this image to cloudinary',
        500
      );
      return next(error);
    }
    imageUrl = uploadedResponse.url;
  }
  // for cloudinary link


const monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const today = new Date()
const month = today.getMonth() + 1
const day = today.getDate()
const year = today.getFullYear()
const codeTime = today.getTime()
const stringMonth = monthArray[month - 1]

//check if token id is the actual role and id of someone in the conversation

convo.messages= [...convo.messages, {message: message, user: userId, date: {fullDate: today, month: month, day: day, year: year, time:codeTime, monthString: stringMonth}, image: imageUrl }]
if (role === 'client') {
  convo.coachNotifications = convo.coachNotifications + 1
  coach.notifications = {
    clients: [...coach.notifications.clients],
    workouts: [...coach.notifications.workouts],
    diets: [...coach.notifications.diets],
    messages: [...coach.notifications.messages, convo.id],
    checkins: [...coach.notifications.checkins]
  }
}

if (role === 'coach') {
  convo.clientNotifications = convo.clientNotifications + 1
  client.notifications = {
    clients: [...client.notifications.clients],
    workouts: [...client.notifications.workouts],
    diets: [...client.notifications.diets],
    messages: [...client.notifications.messages, convo.id],
    checkins: [...client.notifications.checkins]
  }
}

try {
  await convo.save();
} catch(err) {
  const error = new HttpError('sending this message did not work.', 500)
  return next(error)
}

try {
  await coach.save();
} catch(err) {
  const error = new HttpError('sending this message did not work.', 500)
  return next(error)
}

try {
  await client.save();
} catch(err) {
  const error = new HttpError('sending this message did not work.', 500)
  return next(error)
}
let convos;
if (role ==='client') {
  try {
    convos = await Convo.find({ client: userId})
  } catch (err) {
    const error = new HttpError('Could not fetch convos', 500)
    return next(error)
  }

}

if (role ==='coach') {
  try {
    convos = await Convo.find({ coach: userId})
  } catch (err) {
    const error = new HttpError('Could not fetch convos', 500)
    return next(error)
  }

}



res.status(200).json({convo: convo.toObject({ getters: true}), convos: convos.map(c => c.toObject({ getters: true }))})

}








const updateDeleteConvo = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {

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