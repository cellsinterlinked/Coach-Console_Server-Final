const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Diet = require('../models/diet');
const Workout = require('../models/workout');
const Checkin = require('../models/checkin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const req = require('express/lib/request');
const user = require('../models/user');
const { modelNames } = require('mongoose');
const mongoose = require('mongoose');
const { cloudinary } = require('../utils/cloudinary');

const createCheckin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const {
    coachId,
    clientId,
    weight,
    bfChest,
    bfAxilla,
    bfTricep,
    bfSubscapular,
    bfAbdominal,
    bfSuprailiac,
    bfThigh,
    images,
    neck,
    bicep,
    forearm,
    chest,
    waist,
    hips,
    thigh,
    calf,
    monSleep,
    tueSleep,
    wedSleep,
    thuSleep,
    friSleep,
    satSleep,
    sunSleep,
    workoutQuality,
    notes,
    workoutId,
    dietId,
    role,
  } = req.body;

  let client;
  let coach;
  let workout;
  let diet;
  let dateAdded;

  //check token matches user

  try {
    client = await User.findById(clientId);
  } catch (err) {
    const error = new HttpError('couldnt find this client.', 500);
    return next(error);
  }

  try {
    coach = await User.findById(coachId);
  } catch (err) {
    const error = new HttpError('Couldnt find this coach.', 500);
    return next(error);
  }

  try {
    workout = await Workout.findById(workoutId);
  } catch (err) {
    const error = new HttpError('couldnt find this workout.', 500);
    return next(error);
  }

  try {
    diet = await Diet.findById(dietId);
  } catch (err) {
    const error = new HttpError('Couldnt find this diet', 500);
    return next(error);
  }

  const uploadFunction = async (uploadedImages) => {
    let imageUrlArray = [];
		if (!uploadedImages || uploadedImages.length < 0) {
      return imageUrlArray;
		}

    let uploadedResponse;
		for (const image of uploadedImages) {
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
			imageUrlArray.push(uploadedResponse.url);
		}

    return imageUrlArray;
  };

  const imageURLs = await uploadFunction(images);

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

  let gender = client.gender;
  let age = client.age;
  let bfAddedTotal;
  let fatMass;
  let leanBodyMass;
  let bfFinal;

  const fatCalculator = () => {
    bfAddedTotal = 0;
    if (bfChest) {
      bfAddedTotal = bfAddedTotal + bfChest;
    } else {
      bfAddedTotal = null;
      return;
    }
    if (bfAxilla) {
      bfAddedTotal = bfAddedTotal + bfAxilla;
    } else {
      bfAddedTotal = null;
      return;
    }
    if (bfTricep) {
      bfAddedTotal = bfAddedTotal + bfTricep;
    } else {
      bfAddedTotal = null;
      return;
    }
    if (bfSubscapular) {
      bfAddedTotal = bfAddedTotal + bfSubscapular;
    } else {
      bfAddedTotal = null;
      return;
    }
    if (bfAbdominal) {
      bfAddedTotal = bfAddedTotal + bfAbdominal;
    } else {
      bfAddedTotal = null;
      return;
    }
    if (bfSuprailiac) {
      bfAddedTotal = bfAddedTotal + bfSuprailiac;
    } else {
      bfAddedTotal = null;
      return;
    }
    if (bfThigh) {
      bfAddedTotal = bfAddedTotal + bfThigh;
    } else {
      bfAddedTotal = null;
      return;
    }

    if (gender === 1) {
      bfFinal =
        495 /
          (1.112 -
            0.00043499 * bfAddedTotal +
            0.00000055 * bfAddedTotal * bfAddedTotal -
            0.00028826 * age) -
        450;
    } else if (gender === 2) {
      bfFinal =
        495 /
          (1.097 -
            0.00046971 * bfAddedTotal +
            0.00000056 * bfAddedTotal * bfAddedTotal -
            0.00012828 * age) -
        450;
    }
    // ROUND THESE NUMBERS!
    fatMass = weight * (bfFinal * 0.01);
    leanBodyMass = weight - weight * (bfFinal * 0.01);
  };

  fatCalculator();

  let measurementTotal;

  const measurementCalculator = () => {
    measurementTotal = 0;
    if (neck) {
      measurementTotal = measurementTotal + neck;
    } else {
      measurementTotal = null;
      return;
    }
    if (bicep) {
      measurementTotal = measurementTotal + bicep;
    } else {
      measurementTotal = null;
      return;
    }
    if (forearm) {
      measurementTotal = measurementTotal + forearm;
    } else {
      measurementTotal = null;
      return;
    }
    if (chest) {
      measurementTotal = measurementTotal + chest;
    } else {
      measurementTotal = null;
      return;
    }
    if (waist) {
      measurementTotal = measurementTotal + waist;
    } else {
      measurementTotal = null;
      return;
    }
    if (hips) {
      measurementTotal = measurementTotal + hips;
    } else {
      measurementTotal = null;
      return;
    }
    if (thigh) {
      measurementTotal = measurementTotal + thigh;
    } else {
      measurementTotal = null;
      return;
    }
    if (calf) {
      measurementTotal = measurementTotal + calf;
    } else {
      measurementTotal = null;
      return;
    }
  };

  measurementCalculator();

  let sleepTotal;
  let sleepAvg;

  const sleepCalculator = () => {
    sleepTotal = 0;
    if (monSleep) {
      sleepTotal = sleepTotal + monSleep;
    } else {
      sleepTotal = null;
      return;
    }
    if (tueSleep) {
      sleepTotal = sleepTotal + tueSleep;
    } else {
      sleepTotal = null;
      return;
    }
    if (wedSleep) {
      sleepTotal = sleepTotal + wedSleep;
    } else {
      sleepTotal = null;
      return;
    }
    if (thuSleep) {
      sleepTotal = sleepTotal + thuSleep;
    } else {
      sleepTotal = null;
      return;
    }
    if (friSleep) {
      sleepTotal = sleepTotal + friSleep;
    } else {
      sleepTotal = null;
      return;
    }
    if (satSleep) {
      sleepTotal = sleepTotal + satSleep;
    } else {
      sleepTotal = null;
      return;
    }
    if (sunSleep) {
      sleepTotal = sleepTotal + sunSleep;
    } else {
      sleepTotal = null;
      return;
    }
    sleepAvg = sleepTotal / 7;
  };
  sleepCalculator();

  let avgWorkoutQuality;

  const workoutCalculator = () => {
    let total = 0;
    if (
      !workoutQuality ||
      (workoutQuality && workoutQuality.length !== workout.weightData.length)
    ) {
      return;
    } else {
      for (let i = 0; i < workoutQuality.length; i++) {
        total = total + workoutQuality[i];
      }
    }
    avgWorkoutQuality = total / workoutQuality.length;
  };

  workoutCalculator();

  let createdCheckin = new Checkin({
    date: dateAdded,
    client: client.id,
    coach: coach.id,
    weight: weight,
    notified: false,
  });

  if (imageURLs.length > 0) {
    createdCheckin.images = imageURLs;
  }

  if (workout) {
    createdCheckin.workout = workout.id;
  }
  if (diet) {
    createdCheckin.diet = diet.id;
  }
  if (bfFinal) {
    createdCheckin.bfTotal = bfFinal;
  }
  if (leanBodyMass) {
    createdCheckin.leanBodyMass = leanBodyMass;
  }
  if (fatMass) {
    createdCheckin.fatMass = fatMass;
  }
  if (sleepTotal) {
    createdCheckin.sleepTotal = sleepTotal;
  }
  if (sleepAvg) {
    createdCheckin.sleepAvg = sleepAvg;
  }
  if (avgWorkoutQuality) {
    createdCheckin.avgWorkoutQuality = avgWorkoutQuality;
  }
  if (measurementTotal) {
    createdCheckin.measurementTotal = measurementTotal;
  }
  if (bfChest) {
    createdCheckin.bfChest = bfChest;
  }
  if (bfAxilla) {
    createdCheckin.bfAxilla = bfAxilla;
  }
  if (bfTricep) {
    createdCheckin.bfTricep = bfTricep;
  }
  if (bfSubscapular) {
    createdCheckin.bfSubscapular = bfSubscapular;
  }
  if (bfAbdominal) {
    createdCheckin.bfAbdominal = bfAbdominal;
  }
  if (bfSuprailiac) {
    createdCheckin.bfSuprailiac = bfSuprailiac;
  }
  if (bfThigh) {
    createdCheckin.bfThigh = bfThigh;
  }



  // cloudinary stuff
  if (neck) {
    createdCheckin.neck = neck;
  }
  if (bicep) {
    createdCheckin.bicep = bicep;
  }
  if (forearm) {
    createdCheckin.forearm = forearm;
  }
  if (chest) {
    createdCheckin.chest = chest;
  }
  if (waist) {
    createdCheckin.waist = waist;
  }
  if (hips) {
    createdCheckin.hips = hips;
  }
  if (thigh) {
    createdCheckin.thigh = thigh;
  }
  if (calf) {
    createdCheckin.calf = calf;
  }

  if (monSleep) {
    createdCheckin.monSleep = monSleep;
  }
  if (tueSleep) {
    createdCheckin.tueSleep = tueSleep;
  }
  if (wedSleep) {
    createdCheckin.wedSleep = wedSleep;
  }
  if (thuSleep) {
    createdCheckin.thuSleep = thuSleep;
  }
  if (friSleep) {
    createdCheckin.friSleep = friSleep;
  }
  if (satSleep) {
    createdCheckin.satSleep = satSleep;
  }
  if (sunSleep) {
    createdCheckin.sunSleep = sunSleep;
  }

  if (workoutQuality) {
    createdCheckin.workoutQuality = workoutQuality;
  }
  if (notes) {
    createdCheckin.notes = notes;
  }
  if (diet) {
    createdCheckin.weekCals = diet.weeklyCals;
  }
  if (diet) {
    createdCheckin.weekPro = diet.weeklyPro;
  }
  if (diet) {
    createdCheckin.weekFat = diet.weeklyFat;
  }
  if (diet) {
    createdCheckin.weekCarb = diet.weeklyCarb;
  }
  if (diet) {
    createdCheckin.totalCals = diet.totalCals;
  }
  if (diet) {
    createdCheckin.totalCarb = diet.totalCarb;
  }
  if (diet) {
    createdCheckin.totalPro = diet.totalPro;
  }
  if (diet) {
    createdCheckin.totalFat = diet.totalFat;
  }

  if (workout) {
    createdCheckin.totalSets = workout.totalSets;
  }
  if (workout) {
    createdCheckin.cardioTime = workout.cardioTime;
  }
  if (workout) {
    createdCheckin.cardioCals = workout.cardioCals;
  }

  // put this into a block????

  try {
    await createdCheckin.save();
  } catch (err) {
    const error = new HttpError(
      `error saving checkin. here is the error ${err}.`,
      500
    );
    return next(error);
  }

  client.checkins = [...client.checkins, createdCheckin.id];

  if (role === 'client') {
    coach.notifications = {
      clients: [...coach.notifications.clients],
      workouts: [...coach.notifications.workouts],
      diets: [...coach.notifications.diets],
      messages: [...coach.notifications.messages],
      checkins: [...coach.notifications.checkins, createdCheckin.id]
    }
  }

  if (role === 'coach') {
    client.notifications = {
      clients: [...client.notifications.clients],
      workouts: [...client.notifications.workouts],
      diets: [...client.notifications.diets],
      messages: [...client.notifications.messages],
      checkins: [...client.notifications.checkins, createdCheckin.id]
    }
  }

  try {
    await client.save();
  } catch (err) {
    const error = new HttpError(
      `error saving client. here is the error ${err}.`,
      500
    );
    return next(error);
  }

  try {
    await coach.save();
  } catch (err) {
    const error = new HttpError(
      `error saving coach. here is the error ${err}.`,
      500
    );
    return next(error);
  }

  res.status(200).json({ checkin: createdCheckin.toObject({ getters: true }) });
};






const deleteCheckin = async (req, res, next) => {
  const checkinId = req.params.cid

  let checkin;
  let user;


  try {
    checkin = await Checkin.findById(checkinId).populate("client")
  } catch (err) {
    const error = new HttpError(
      'Could not find a checkin with the given id',
      500
      );
      return next(error);
    }

  // try {
  //   user = await User.findById(checkin.client)
  // } catch (err) {
  //   const error = new HttpError(
  //     'Could not find a client with the given id',
  //     500
  //     );
  //     return next(error);
  //   }

  //   user.checkins = user.checkins.filter(checkin => checkin.id !== checkinId)

  //   try {
  //     const sess = await mongoose.startSession();
  //     sess.startTransaction();
  //     await checkin.remove({ session: sess });
  //     await user.save({ session: sess });
  //     await sess.commitTransaction();
  //   } catch (err) {
  //     const error = new HttpError(`Could not delete this checkin ${err}`, 500);
  //     return next(error);
  //   }



  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await checkin.remove({ session: sess });
    checkin.client.checkins.pull(checkin);
    await checkin.client.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(`Could not delete this checkin ${err}`, 500);
    return next(error);
  }

  res.status(200).json({ message: 'checkin deleted' });
};











const getCheckins = async (req, res, next) => {
  const clientId = req.params.uid;
  let client;
  let checkins;

  try {
    client = await User.findById(clientId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
  }

  //check if token is of the client or client's coach

  try {
    checkins = await Checkin.find({ client: client.id });
  } catch (err) {
    const error = new HttpError('There was an issue fetching checkins', 500);
    return next(error);
  }

  let ltBodyFat = [];
  let ltLeanBodyMass = [];
  let ltFatMass = [];
  let ltWeight = [];
  let ltSleepAvg = [];
  let ltWorkoutQuality = [];
  let ltMeasurementTotal = [];
  let ltTotalCals = [];
  let ltTotalCarb = [];
  let ltTotalPro = [];
  let ltTotalFat = [];
  let ltTotalSets = [];
  let ltCardioTime = [];
  let ltCardioCals = [];

  for (let i = 0; i < checkins.length; i++) {
    if (checkins[i].bfTotal) {
      ltBodyFat.push({
        value: checkins[i].bfTotal,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].leanBodyMass) {
      ltLeanBodyMass.push({
        value: checkins[i].leanBodyMass,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].fatMass) {
      ltFatMass.push({
        value: checkins[i].fatMass,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].weight) {
      ltWeight.push({
        value: checkins[i].weight,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].sleepAvg) {
      ltSleepAvg.push({
        value: checkins[i].sleepAvg,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].workoutQuality) {
      ltWorkoutQuality.push({
        value: checkins[i].workoutQuality,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].measurementTotal) {
      ltMeasurementTotal.push({
        value: checkins[i].measurementTotal,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].totalCals) {
      ltTotalCals.push({
        value: checkins[i].totalCals,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].totalCarb) {
      ltTotalCarb.push({
        value: checkins[i].totalCarb,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].totalPro) {
      ltTotalPro.push({
        value: checkins[i].totalPro,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].totalFat) {
      ltTotalFat.push({
        value: checkins[i].totalFat,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].totalSets) {
      ltTotalSets.push({
        value: checkins[i].totalSets,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].cardioTime) {
      ltCardioTime.push({
        value: checkins[i].cardioTime,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
    if (checkins[i].cardioCals) {
      ltCardioCals.push({
        value: checkins[i].cardioCals,
        date: `${checkins[i].date.monthString.slice(0, 3).toUpperCase()} ${
          checkins[i].date.day
        }`,
      });
    }
  }

  let totals = {
    ltBodyFat,
    ltLeanBodyMass,
    ltFatMass,
    ltWeight,
    ltSleepAvg,
    ltWorkoutQuality,
    ltMeasurementTotal,
    ltTotalCals,
    ltTotalCarb,
    ltTotalPro,
    ltTotalFat,
    ltTotalSets,
    ltCardioTime,
    ltCardioCals,
  };

  res
    .status(200)
    .json({
      totals: totals,
      checkins: checkins.map((c) => c.toObject({ getters: true })),
    });
};

exports.getCheckins = getCheckins;
exports.deleteCheckin = deleteCheckin;
exports.createCheckin = createCheckin;
