const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Diet = require('../models/diet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const req = require('express/lib/request');
const user = require('../models/user');
const { modelNames } = require('mongoose');
const { default: mongoose } = require('mongoose');

const createDiet = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const { userId, name, description, food, type } = req.body;
  let user;
  let dateAdded;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
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

  for (let i = 0; i < food.length; i++) {
    // looping through the food array.

    let calorieTotal = 0;
    let proteinTotal = 0;
    let fatTotal = 0;
    let carbTotal = 0;
    for (let j = 0; j < food[i].data.length; j++) {
      if (food[i].data[j].cals) {
        calorieTotal = calorieTotal + parseInt(food[i].data[j].cals);
      }
      if (food[i].data[j].fat) {
        fatTotal = fatTotal + parseInt(food[i].data[j].fat);
      }
      if (food[i].data[j].carb) {
        carbTotal = carbTotal + parseInt(food[i].data[j].carb);
      }
      if (food[i].data[j].pro) {
        proteinTotal = proteinTotal + parseInt(food[i].data[j].pro);
      }
    }
    food[i].totalCals = calorieTotal;
    food[i].totalFat = fatTotal;
    food[i].totalPro = proteinTotal;
    food[i].totalCarb = carbTotal;
  }

  let weeklyCals = [];
  let weeklyPro = [];
  let weeklyFat = [];
  let weeklyCarb = [];

  let totalCals = 0;
  let totalPro = 0;
  let totalFat = 0;
  let totalCarb = 0;

  if (type === 'multi') {
    for (let i = 0; i < food.length; i++) {
      weeklyCals.push(food[i].totalCals);
      totalCals = totalCals + food[i].totalCals;

      weeklyPro.push(food[i].totalPro);
      totalPro = totalPro + food[i].totalPro;

      weeklyFat.push(food[i].totalFat);
      totalFat = totalFat + food[i].totalFat;

      weeklyCarb.push(food[i].totalCarb);
      totalCarb = totalCarb + food[i].totalCarb;
    }
  }

  if (type === 'single') {
    for (let i = 0; i < 7; i++) {
      weeklyCals.push(food[0].totalCals);
      totalCals = totalCals + parseInt(food[0].totalCals);

      weeklyPro.push(food[0].totalPro);
      totalPro = totalPro + parseInt(food[0].totalPro);

      weeklyFat.push(food[0].totalFat);
      totalFat = totalFat +parseInt(food[0].totalFat);

      weeklyCarb.push(food[0].totalCarb);
      totalCarb = totalCarb + parseInt(food[0].totalCarb);
    }
  }

  const createdDiet = new Diet({
    creator: user.id,
    name: name,
    description: description,
    dateAdded: dateAdded,
    weeklyCals: weeklyCals,
    weeklyPro: weeklyPro,
    weeklyFat: weeklyFat,
    weeklyCarb: weeklyCarb,
    totalCals: totalCals,
    totalPro: totalPro,
    totalFat: totalFat,
    totalCarb: totalCarb,
    type: type,
    food: food,
  });

  try {
    await createdDiet.save();
  } catch (err) {
    const error = new HttpError(`here is the error ${err}.`, 500);
    return next(error);
  }

  user.diets = [...user.diets, createdDiet.id];

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Adding this workout to the user didnt work.',
      500
    );
    return next(error);
  }

  res.status(200).json({ diet: createdDiet.toObject({ getters: true }) });
};


const getDiets = async (req, res, next) => {
  const userId = req.params.uid;
  let user;
  let diets;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
  }


  try {
    diets = await Diet.find()
  } catch (err) {
    const error = new HttpError('There was an issue fetching diets', 500);
    return next(error);
  }

  let userDiets = diets.filter(diet => user.diets.includes(diet.id))


  res.status(200).json({ diets: userDiets.map(diet => diet.toObject({getters: true})) })
}

const editDiet = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const {food, userId, dietId} = req.body;
  let diet;
  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('Couldnt find that client', 500);
    return next(error);
  }

  try {
    diet = await Diet.findById(dietId);
  } catch (err) {
    const error = new HttpError('Couldnt find that workout', 500);
    return next(error);
  }

  let type = diet.type;

  if (!user.diets.includes(diet.id)) {
    return next(new HttpError('This isnt one of your diets, bud.', 500));
  }

  for (let i = 0; i < food.length; i++) {
    // looping through the food array.

    let calorieTotal = 0;
    let proteinTotal = 0;
    let fatTotal = 0;
    let carbTotal = 0;
    for (let j = 0; j < food[i].data.length; j++) {
      if (food[i].data[j].cals) {
        calorieTotal = calorieTotal + parseInt(food[i].data[j].cals);
      }
      if (food[i].data[j].fat) {
        fatTotal = fatTotal + parseInt(food[i].data[j].fat);
      }
      if (food[i].data[j].carb) {
        carbTotal = carbTotal + parseInt(food[i].data[j].carb);
      }
      if (food[i].data[j].pro) {
        proteinTotal = proteinTotal + parseInt(food[i].data[j].pro);
      }
    }
    food[i].totalCals = calorieTotal;
    food[i].totalFat = fatTotal;
    food[i].totalPro = proteinTotal;
    food[i].totalCarb = carbTotal;
  }

  let weeklyCals = [];
  let weeklyPro = [];
  let weeklyFat = [];
  let weeklyCarb = [];

  let totalCals = 0;
  let totalPro = 0;
  let totalFat = 0;
  let totalCarb = 0;

  if (type === 'multi') {
    for (let i = 0; i < food.length; i++) {
      weeklyCals.push(food[i].totalCals);
      totalCals = totalCals + parseInt(food[i].totalCals);

      weeklyPro.push(food[i].totalPro);
      totalPro = totalPro + parseInt(food[i].totalPro);

      weeklyFat.push(food[i].totalFat);
      totalFat = totalFat + parseInt(food[i].totalFat);

      weeklyCarb.push(food[i].totalCarb);
      totalCarb = totalCarb + parseInt(food[i].totalCarb);
    }
  }

  if (type === 'single') {
    for (let i = 0; i < 7; i++) {
      weeklyCals.push(food[0].totalCals);
      totalCals = totalCals + parseInt(food[0].totalCals);

      weeklyPro.push(food[0].totalPro);
      totalPro = totalPro + parseInt(food[0].totalPro);

      weeklyFat.push(food[0].totalFat);
      totalFat = totalFat + parseInt(food[0].totalFat);

      weeklyCarb.push(food[0].totalCarb);
      totalCarb = totalCarb + parseInt(food[0].totalCarb);
    }
  }

  diet.food = food;
  diet.weeklyCals = weeklyCals;
  diet.weeklyCarb = weeklyCarb;
  diet.weeklyFat = weeklyFat;
  diet.weeklyPro = weeklyPro;
  diet.totalCals = totalCals;
  diet.totalPro = totalPro;
  diet.totalFat = totalFat;
  diet.totalCarb = totalCarb;

  try {
    await diet.save();
  } catch (err) {
    const error = new HttpError(`here is the error ${err}.`, 500);
    return next(error);
  }

  res.status(200).json({ diet: diet.toObject({ getters: true }) });


}

const sendDiet = async(req, res, next) => {
  const { userId, clientId, dietId } = req.body;
  let client;
  let diet;
  let user;


  try {
    user = await User.findById(userId)
  } catch (err) {
    const error = new HttpError('Couldnt find that user', 500);
    return next(error);
  }

  try {
    client = await User.findById(clientId);
  } catch (err) {
    const error = new HttpError('Couldnt find that client', 500);
    return next(error);
  }

  try {
    diet = await Diet.findById(dietId);
  } catch (err) {
    const error = new HttpError('Couldnt find that diet', 500);
    return next(error);
  }
  if (client.diets.includes(diet.id)) {
    const error = new HttpError('Looks like they already have this diet! ', 500);
    return next(error);
  }

  if (user.role === 'client' && client.clients.includes(user.id) === false) {
    const error = new HttpError('Cannot share a diet if you arent their client or coach! ', 500);
    return next(error);
  }

  if (user.role === 'coach' && client.coach.includes(user.id) === false) {
    const error = new HttpError('Cannot share a diet if you arent their client or coach! ', 500);
    return next(error);
  }


  //check if coach is the id of the token

  client.diets = [...client.diets, diet.id];


  client.notifications = {
    clients: [...client.notifications.clients],
    workouts: [...client.notifications.workouts],
    diets: [...client.notifications.diets, diet.id],
    messages: [...client.notifications.messages],
    checkins: [...client.notifications.checkins]
  }



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
}


const deleteDiet = async(req, res, next) => {
  const dietId = req.params.did;

  let diet;

  try {
    diet = await Diet.findById(dietId).populate('creator');
  } catch(err) {
    const error = new HttpError('Couldnt find this diet')
    return next(error)
  }

  if (!diet) {
    const error = new HttpError('Could not find a post for this id', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await diet.remove({ session: sess });
    diet.creator.diets.pull(diet);
    await diet.creator.save({session: sess})
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Could not delete this diet', 500);
    return next(error)
  }
  res.status(200).json({message: 'diet deleted' });


}

exports.deleteDiet = deleteDiet;
exports.sendDiet = sendDiet;
exports.editDiet = editDiet;
exports.getDiets = getDiets;
exports.createDiet = createDiet;
