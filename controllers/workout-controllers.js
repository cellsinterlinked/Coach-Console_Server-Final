const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Workout = require('../models/workout');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const req = require('express/lib/request');
const user = require('../models/user');
const { default: mongoose } = require('mongoose');

const createWorkout = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const { userId, name, description, cardioData, weightData } = req.body;
  let user;
  let dateAdded;
  let workouts;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
  }

  try {
    workouts = await Workout.find()
  } catch (err) {
    const error = new HttpError('couldnt fetch workouts', 500);
    return next(error);
  }

  console.log(workouts)

  let nameArr = workouts.filter(e => e.name === name)

  console.log(nameArr)

  if (nameArr === []) {
    const error = new HttpError('This is already the name of a workout')
    return next(error)
  }

  const monthArray = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear();
  const codeTime = today.getTime();
  const stringMonth = monthArray[month - 1];

  dateAdded = {
    fullDate: today,
    month: month,
    day: day,
    year: year,
    time: codeTime,
    monthString: stringMonth,
  };
  let volumeTotal = 0;
  for (let i = 0; i < weightData.length; i++) {
    for (let j = 0; j < weightData[i].data.length; j++) {
      if (weightData[i].data[j].exercise) {
        volumeTotal = parseInt(volumeTotal) + parseInt(weightData[i].data[j].sets);
      }
    }
  }

  let calorieTotal = 0;
  let timeTotal = 0;
  for (let i = 0; i < cardioData.length; i++) {
    for (let j = 0; j < cardioData[i].data.length; j++) {
    if (cardioData[i].data[j].cals) {
      calorieTotal = parseInt(calorieTotal) + parseInt(cardioData[i].data[j].cals);
    }
    if (cardioData[i].data[j].time) {
      timeTotal = parseInt(timeTotal) + parseInt(cardioData[i].data[j].time);
    }
  }
  }

  const createdWorkout = new Workout({
    creator: user.id,
    name: name,
    description: description,
    dateAdded: dateAdded,
    totalSets: volumeTotal,
    cardioTime: timeTotal,
    cardioCals: calorieTotal,
    weightData: weightData,
    cardioData: cardioData,
  });

  // make this block into a session

  try {
    await createdWorkout.save();
  } catch (err) {
    const error = new HttpError(`here is the error ${err}.`, 500);
    return next(error);
  }

  user.workouts = [...user.workouts, createdWorkout.id];

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Adding this workout to the user didnt work.',
      500
    );
    return next(error);
  }

  res.status(200).json({ workout: createdWorkout.toObject({ getters: true }) });
};

const sendWorkout = async (req, res, next) => {
  const { userId, clientId, workoutId } = req.body;
  let client;
  let workout;

  try {
    client = await User.findById(clientId);
  } catch (err) {
    const error = new HttpError('Couldnt find that client', 500);
    return next(error);
  }

  try {
    workout = await Workout.findById(workoutId);
  } catch (err) {
    const error = new HttpError('Couldnt find that workout', 500);
    return next(error);
  }

  if (client.workouts.indexOf(workout.id) !== -1) {
    const error = new HttpError('They already have this workout')
    return next(error)
  }

  //check if coach is the id of the token

  client.workouts = [...client.workouts, workout.id];

  try {
    await client.save();
  } catch (err) {
    const error = new HttpError(
      'Adding this workout to the client didnt work.',
      500
    );
    return next(error);
  }

  res.status(200).json({ client: client.toObject({ getters: true }) });
};





const editWorkout = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const { userId, workoutId, cardioData, weightData } = req.body;
  let workout;
  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('Couldnt find that client', 500);
    return next(error);
  }

  try {
    workout = await Workout.findById(workoutId);
  } catch (err) {
    const error = new HttpError('Couldnt find that workout', 500);
    return next(error);
  }

  if (!user.workouts.includes(workout.id)) {
    return next(new HttpError('This isnt one of your workouts, bud.', 500));
  }

  let volumeTotal = 0;
  for (let i = 0; i < weightData.length; i++) {
    for (let j = 0; j < weightData[i].data.length; j++) {
      if (weightData[i].data[j].exercise) {
        volumeTotal = volumeTotal + parseInt(weightData[i].data[j].sets);
      }
    }
  }


  let calorieTotal = 0;
  let timeTotal = 0;
  for (let i = 0; i < cardioData.length; i++) {
    for (let j = 0; j < cardioData[i].data.length; j++) {
    if (cardioData[i].data[j].cals) {
      calorieTotal = parseInt(calorieTotal) + parseInt(cardioData[i].data[j].cals);
    }
    if (cardioData[i].data[j].time) {
      timeTotal = parseInt(timeTotal) + parseInt(cardioData[i].data[j].time);
    }
  }
  }

  workout.totalSets = volumeTotal;
  workout.cardioCals = calorieTotal;
  workout.cardioTime = timeTotal;
  workout.weightData = weightData;
  workout.cardioData = cardioData;

  try {
    await workout.save();
  } catch (err) {
    const error = new HttpError(`here is the error ${err}.`, 500);
    return next(error);
  }

  res.status(200).json({ workout: workout.toObject({ getters: true }) });
};


const getWorkouts = async (req, res, next) => {
  const userId = req.params.uid;
  let user;
  let workouts;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
  }


  try {
    workouts = await Workout.find()
  } catch (err) {
    const error = new HttpError('There was an issue fetching workouts', 500);
    return next(error);
  }

  let userWorkouts = workouts.filter(workout => user.workouts.includes(workout.id))


  res.status(200).json({ workouts: userWorkouts.map(diet => diet.toObject({getters: true})) })
}

const deleteWorkout = async (req, res, next) => {
  const workoutId = req.params.wid;

  let workout;

  try {
    workout = await Workout.findById(workoutId).populate('creator');
  } catch(err) {
    const error = new HttpError('Couldnt find this workout')
    return next(error)
  }

  if (!workout) {
    const error = new HttpError('Could not find a post for this id', 404);
    return next(error);
  }



  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await workout.remove({ session: sess });
    workout.creator.workouts.pull(workout);
    await workout.creator.save({session: sess})
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Could not delete this workout', 500);
    return next(error)
  }
  res.status(200).json({message: 'workout deleted' });

};

exports.getWorkouts = getWorkouts;
exports.editWorkout = editWorkout;
exports.sendWorkout = sendWorkout;
exports.createWorkout = createWorkout;
exports.deleteWorkout = deleteWorkout;
