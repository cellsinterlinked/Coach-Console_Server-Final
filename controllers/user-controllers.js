const HttpError = require('../models/http-error');
const User = require('../models/user');
const Convo = require('../models/convo');
const Workout = require('../models/workout');
const Diet = require('../models/diet');
const Checkin = require('../models/checkin');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const req = require('express/lib/request');
const user = require('../models/user');
const { cloudinary } = require('../utils/cloudinary');
const Str = require('@supercharge/strings');

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const { password, email, role, coachCode } = req.body;
  //add logic to match coach with coachCode
  let existingEmail;

  try {
    existingEmail = await User.findOne({ email: email });
  } catch (err) {
    const error = newHttpError('Signing up failed. Try again later 1', 500);
    return next(error);
  }

  if (existingEmail) {
    const error = new HttpError(
      ' Email is associated with another account already',
      422
    );
    return next(error);
  }

  let code = Str.random().slice(0, 10);

  // if role is client
  let codedUser;
  let coachId = [];

  if (role === 'client' && coachCode) {
    try {
      codedUser = await User.findOne({ code: coachCode });
    } catch (err) {
      const error = newHttpError('Couldnt find a coach with this code', 500);
      return next(error);
    }
    if (!codedUser) {
      const error = new HttpError(
        ' Could not find a coach with this code',
        422
      );
      return next(error);
    } else {
      coachId = codedUser.id;
    }
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('creashed while creating hashed password', 500);
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

  dateJoined = {
    fullDate: today,
    month: month,
    day: day,
    year: year,
    time: codeTime,
    monthString: stringMonth,
  };

  const createdUser = new User({
    email,
    password: hashedPassword,
    role,
    workouts: [],
    image:
      'https://res.cloudinary.com/dbnapmpvm/image/upload/v1650386345/coachProd/CA1FBEAB-E7C5-43FC-BFAF-ABFB12A5CB47_4_5005_c_gfahev.jpg',
    workouts: [],
    name: '',
    diets: [],
    conversations: [],
    clients: [],
    coach: coachId,
    gender: 0,
    age: 0,
    dateJoined: dateJoined,
    code: code,
    notifications: {
      clients: [],
      workouts: [],
      diets: [],
      messages: [],
      checkins: [],
    },
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Creating user failed 1 ', 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Creating user failed 2 ', 500);
    return next(error);
  }

  if (role === 'client') {
    const createdConvo = new Convo({
      coach: codedUser.id,
      client: createdUser.id,
      messages: [],
      clientNotifications: 0,
      coachNotifications: 0,
    });

    try {
      await createdConvo.save();
    } catch (err) {
      const error = new HttpError('Creating convo failed 1 ', 500);
      return next(error);
    }

    codedUser.clients.push(createdUser.id);
    codedUser.conversations.push(createdConvo.id);
    codedUser.notifications = {
      clients: [...codedUser.notifications.clients, createdUser.id],
      workouts: [...codedUser.notifications.workouts],
      diets: [...codedUser.notifications.diets],
      messages: [...codedUser.notifications.messages],
      checkins: [...codedUser.notifications.checkins],
    };
    createdUser.conversations.push(createdConvo.id);

    try {
      createdUser.save();
    } catch (err) {
      const error = new HttpError('could not update the client', 500);
      return next(error);
    }

    try {
      codedUser.save();
    } catch (err) {
      const error = new HttpError(
        'could not update coach list of clients',
        500
      );
      return next(error);
    }

    try {
      token = jwt.sign(
        {
          userId: createdUser.id,
          email: createdUser.email,
          role: createdUser.role,
        },
        process.env.JWT_KEY,
        { expiresIn: '1h' }
      );
    } catch (err) {
      const error = new HttpError('Creating user failed 2 ', 500);
      return next(error);
    }
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
    token: token,
    userName: createdUser.userName,
  });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const { email, password } = req.body;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email }); //validating email
  } catch (err) {
    const error = new HttpError('logging in failed, please try again ', 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError('Invalid Credentials', 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Logging in failed', 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    role: existingUser.role,
    token: token,
  });
};

const tempUpdate = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find this user',
      500
    );
    return next(error);
  }

  user.notifications = {
    clients: [],
    workouts: [],
    diets: [],
    messages: [],
    checkins: [],
  };

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(`Could not update user ${err}`, 500);
    return next(error);
  }
  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updateNotifications = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }
  const userId = req.params.uid;
  const { workout, diet, client, message, checkin } = req.body;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find this user',
      500
    );
    return next(error);
  }

  if (workout) {
    user.notifications = {
      clients: [...user.notifications.clients],
      workouts: user.notifications.workouts.filter((item) => item !== workout),
      diets: [...user.notifications.diets],
      messages: [...user.notifications.messages],
      checkins: [...user.notifications.checkins],
    };
  }
  if (diet) {
    user.notifications = {
      clients: [...user.notifications.clients],
      workouts: [...user.notifications.workouts],
      diets: user.notifications.diets.filter((item) => item !== diet),
      messages: [...user.notifications.messages],
      checkins: [...user.notifications.checkins],
    };
  }
  if (client) {
    user.notifications = {
      clients: user.notifications.clients.filter((item) => item !== client),
      workouts: [...user.notifications.workouts],
      diets: [...user.notifications.diets],
      messages: [...user.notifications.messages],
      checkins: [...user.notifications.checkins],
    };
  }

  if (message) {
    user.notifications = {
      clients: [...user.notifications.clients],
      workouts: [...user.notifications.workouts],
      diets: [...user.notifications.diets],
      messages: user.notifications.messages.filter((item) => item !== message),
      checkins: [...user.notifications.checkins],
    };
  }
  if (checkin) {
    user.notifications = {
      clients: [...user.notifications.clients],
      workouts: [...user.notifications.workouts],
      diets: [...user.notifications.diets],
      messages: [...user.notifications.messages],
      checkins: user.notifications.checkins.filter((item) => item !== checkin),
    };
  }

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(`Could not update user ${err}`, 500);
    return next(error);
  }
  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Invalid inputs passed. Make sure all inputs have been filled out.',
        422
      )
    );
  }

  const { name, image, age, gender } = req.body;
  const userId = req.params.uid;
  let user;
  let imageUrl;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find this user',
      500
    );
    return next(error);
  }

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

  if (imageUrl) {
    user.image = imageUrl;
  }

  if (age) {
    user.age = age;
  }
  if (name) {
    user.name = name;
  }
  if (gender) {
    user.gender = gender;
  }
  user.checkins = [];

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(`Could not update user ${err}`, 500);
    return next(error);
  }
  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const getAllUsers = async (req, res, next) => {
  // this needs to remove users that are already clients!!!
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError('Fetching users failed', 500);
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getClients = async (req, res, next) => {
  let userId = req.params.uid;
  let clients;
  let user;
  let users;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('Something went wrong', 500);
    return next(error);
  }

  if (user.clients.length === 0) {
    const error = new HttpError('This user doesnt have any clients', 500);
    return next(error);
  }
  let newArr = [...user.clients];

  // check if token is of this user

  try {
    clients = await User.find().where('_id').in(newArr).exec();
  } catch (err) {
    const error = new HttpError(
      'Could not establish the list of followed users',
      500
    );
    return next(error);
  }

  res.json({
    clients: clients.map((user) => user.toObject({ getters: true })),
  });
};

const addClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Is this a real person? Is this the matrix?', 422)
    );
  }

  const { givenUser } = req.body;
  const userId = req.params.uid;
  let user;
  let client;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
  }

  if (user.clients.includes(givenUser)) {
    return next(new HttpError('You already have this client, bud', 500));
  }

  try {
    client = await User.findById(givenUser);
  } catch (err) {
    const error = new HttpError(
      'You cannot add a client that does not exist',
      500
    );
    return next(error);
  }

  // check if token is from this user

  if (!client) {
    return next(new HttpError('This user does not exist', 500));
  }

  if (client.coach.length > 0) {
    return next(new HttpError('This client already has a trainer!', 500));
  }

  const createdConvo = new Convo({
    coach: user.id,
    client: client.id,
    messages: [],
    clientNotifications: 0,
    coachNotifications: 0,
  });

  try {
    await createdConvo.save();
  } catch (err) {
    const error = new HttpError('Creating convo failed 1 ', 500);
    return next(error);
  }

  user.clients.push(client.id);
  client.coach.push(user.id);
  user.conversations.push(createdConvo.id);
  client.conversations.push(createdConvo.id);

  try {
    user.save();
  } catch (err) {
    const error = new HttpError('could not update this list of clients', 500);
    return next(error);
  }

  try {
    client.save();
  } catch (err) {
    const error = new HttpError('could not update the coach', 500);
    return next(error);
  }

  res.status(200).json({
    user: user.toObject({ getters: true }),
    client: client.toObject({ getters: true }),
  });
};

const removeClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Is this a real person? Is this the matrix?', 422)
    );
  }

  const { givenUser } = req.body;
  const userId = req.params.uid;
  let user;
  let client;
  let convo;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('you arent a real boy!', 500);
    return next(error);
  }

  if (!user.clients.includes(givenUser)) {
    return next(new HttpError('This client isnt here', 500));
  }

  try {
    client = await User.findById(givenUser);
  } catch (err) {
    const error = new HttpError(
      'You cannot add a client that does not exist',
      500
    );
    return next(error);
  }

  if (!client) {
    return next(new HttpError('This user does not exist', 500));
  }

  if (client.coach.length === 0) {
    return next(
      new HttpError('This client doesnt have a trainer to begin with', 500)
    );
  }

  if (client.conversations.length !== 1) {
    return next(
      new HttpError(
        'Something is wonky with how many convos this guy has.',
        500
      )
    );
  }

  convo = client.conversations[0];
  let fullConvo;
  try {
    fullConvo = await Convo.findById(convo);
  } catch (err) {
    const error = new HttpError(
      'Couldnt delete find convo for some reason.',
      500
    );
    return next(error);
  }

  user.clients = user.clients.filter((user) => client.id === user);
  user.conversations = user.conversations.filter((c) => convo === c);
  client.coach = [];
  client.conversations = [];

  try {
    await fullConvo.remove();
  } catch (err) {
    const error = new HttpError('Could not delete this convo.', 500);
    return next(error);
  }

  try {
    user.save();
  } catch (err) {
    const error = new HttpError('could not update this list of clients', 500);
    return next(error);
  }

  try {
    client.save();
  } catch (err) {
    const error = new HttpError('could not update the coach', 500);
    return next(error);
  }

  res.status(200).json({
    user: user.toObject({ getters: true }),
    client: client.toObject({ getters: true }),
  });
};

const getAllUserData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Is this a real person? Is this the matrix?', 422)
    );
  }

  const userId = req.params.uid;

  //check for token info
  let user;
  let convos;
  let workouts;
  let clients;
  let diets;
  let checkins;
  let userCheckins;
  let code;
  let coach;

  let clientCheckins;
  // checkins for clients?

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('You dont exist', 500);
    return next(error);
  }

  code = user.code;

  let coachId = user.coach[0];

  if (user.role === 'client') {
    try {
      coach = await User.findById(coachId);
    } catch (err) {
      const error = new HttpError('Coach doesnt exist', 500);
      return next(error);
    }
  }
  try {
    convos = await Convo.find({ _id: user.conversations });
  } catch (err) {
    const error = new HttpError('your convo search didnt work', 500);
    return next(error);
  }
  try {
    diets = await Diet.find({ _id: user.diets });
  } catch (err) {
    const error = new HttpError('your diet search didnt work', 500);
    return next(error);
  }
  try {
    workouts = await Workout.find({ _id: user.workouts });
  } catch (err) {
    const error = new HttpError('your workout search didnt work', 500);
    return next(error);
  }
  try {
    clients = await User.find({ _id: user.clients });
  } catch (err) {
    const error = new HttpError('your client search didnt work', 500);
    return next(error);
  }

  try {
    checkins = await Checkin.find({ client: user.clients });
  } catch (err) {
    const error = new HttpError('your checkin search didnt work', 500);
    return next(error);
  }
  /////////////////////////////////////////////////////////////////////////

  try {
    userCheckins = await Checkin.find({ client: userId });
  } catch (err) {
    const error = new HttpError('your checkin search didnt work', 500);
    return next(error);
  }

  try {
    clientCheckins = await Checkin.find({ coach: userId });
  } catch (err) {
    const error = new HttpError('couldnt find the checkins of your clients');
    return next(error);
  }
  // let orderedCheckins = clientCheckins.sort(function (a, b) {
  //   return a.date.time - b.date.time;
  // });

  // let clientTotals = [];
  // let workoutTotals = [];
  // let dietTotals = [];
  // let checkinTotals = [];
  // // this is just the client id. Need whole client info.
  // if (clients) {
  //   for (let i = 0; i < clients.length; i++) {
  //     clientTotals.push({
  //       value: i + 1,
  //       date: `${clients[i].dateJoined.monthString.slice(0, 3).toUpperCase()} ${
  //         clients[i].dateJoined.day
  //       }`,
  //     });
  //   }
  // }

  // if (workouts && workouts.length > 0) {
  //   for (let i = 0; i < workouts.length; i++) {
  //     workoutTotals.push({
  //       value: i + 1,
  //       date: `${workouts[i].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
  //         workouts[i].dateAdded.day
  //       }`,
  //     });
  //   }
  // }

  // if (diets && diets.length > 0) {
  //   for (let i = 0; i < diets.length; i++) {
  //     dietTotals.push({
  //       value: i + 1,
  //       date: `${diets[i].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
  //         diets[i].dateAdded.day
  //       }`,
  //     });
  //   }
  // }

  // if (clientCheckins && clientCheckins.length > 0) {
  //   for (let i = 0; i < orderedCheckins.length; i++) {
  //     checkinTotals.push({
  //       value: i + 1,
  //       date: `${orderedCheckins[i].date.monthString
  //         .slice(0, 3)
  //         .toUpperCase()} ${orderedCheckins[i].date.day}`,
  //     });
  //   }
  // }

  let orderedCheckins
  let orderedDiets
  let orderedWorkouts
  let orderedClients

if (checkins) {
  orderedCheckins = checkins.sort(function (a, b) {
    return a.date.time - b.date.time;
  });
}

if (workouts) {
  orderedWorkouts = workouts.sort(function (a, b) {
    return a.dateAdded.time - b.dateAdded.time;
  });

}
  if (diets) {
  orderedDiets = diets.sort(function (a, b) {
      return b.dateAdded.time - a.dateAdded.time;
    });
  }

if(clients) {
   orderedClients = clients.sort(function (a, b) {
    return a.dateJoined.time - b.dateJoined.time;
  });
}


  let clientTotals = [];
  let workoutTotals = [];
  let dietTotals = [];
  let checkinTotals = [];
// this is just the client id. Need whole client info.
if (clients && clients.length > 1) {
  for (let i = 1; i < orderedClients.length; i++) {
    if(i === orderedClients.length -1) {
      clientTotals.push({
        value: i + 1,
        date: `${clients[i].dateJoined.monthString.slice(0, 3).toUpperCase()} ${
          clients[i].dateJoined.day
        }`,
      });
    }
    if(orderedClients[i - 1].dateJoined.day !==  orderedClients[i].dateJoined.day) {
      clientTotals.push({
        value: i + 1,
        date: `${clients[i-1].dateJoined.monthString.slice(0, 3).toUpperCase()} ${
          clients[i-1].dateJoined.day
        }`,
      });
    }


  }
}

if(clients.length == 1 ) {
  clientTotals.push({
    value: 1,
    date: `${clients[0].dateJoined.monthString.slice(0, 3).toUpperCase()} ${
      clients[0].dateJoined.day
    }`,
  });
}


  if (workouts && workouts.length > 1) {
    for (let i = 1; i < orderedWorkouts.length; i++) {
      if(i === orderedWorkouts.length -1) {
        workoutTotals.push({
          value: i + 1,
          date: `${workouts[i].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
            workouts[i].dateAdded.day
          }`,
        });
      }
      if(orderedWorkouts[i - 1].dateAdded.day !==  orderedWorkouts[i].dateAdded.day) {
        workoutTotals.push({
          value: i + 1,
          date: `${workouts[i-1].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
            workouts[i-1].dateAdded.day
          }`,
        });
      }


    }
  }

  if(workouts.length == 1 ) {
    workoutTotals.push({
      value: 1,
      date: `${workouts[0].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
        workouts[0].dateAdded.day
      }`,
    });
  }

  if (diets && diets.length > 0) {
    for (let i = 1; i < orderedDiets.length; i++) {
      if(i === orderedDiets.length -1) {
        dietTotals.push({
          value: i + 1,
          date: `${diets[i].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
            diets[i].dateAdded.day
          }`,
        });
      }
      if(orderedDiets[i - 1].dateAdded.day !==  orderedDiets[i].dateAdded.day) {
        dietTotals.push({
          value: i + 1,
          date: `${diets[i-1].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
            diets[i-1].dateAdded.day
          }`,
        });
      }


    }
  }

  if(diets.length == 1 ) {
    dietTotals.push({
      value: 1,
      date: `${diets[0].dateAdded.monthString.slice(0, 3).toUpperCase()} ${
        diets[0].dateAdded.day
      }`,
    });
  }





  if (orderedCheckins && orderedCheckins.length > 0) {
    for (let i = 1; i < orderedCheckins.length; i++) {
      if (i === orderedCheckins.length - 1) {
      checkinTotals.push({
        value: i + 1,
        date: `${orderedCheckins[i].date.monthString
          .slice(0, 3)
          .toUpperCase()} ${orderedCheckins[i].date.day}`,
      })
    }
      if(orderedCheckins[i - 1].date.day !==  orderedCheckins[i].date.day) {
        checkinTotals.push({
          value: i + 1,
          date: `${orderedCheckins[i - 1].date.monthString
            .slice(0, 3)
            .toUpperCase()} ${orderedCheckins[i - 1].date.day}`,
        });

      }

    }
  }

  if(checkins.length == 1 ) {
    checkinTotals.push({
      value: 1,
      date: `${checkins[0].date.monthString.slice(0, 3).toUpperCase()} ${
        checkins[0].date.day
      }`,
    });
  }

  //filter this array to only have one value (the largest) for each date ^


  let finalCoach = [];
  let finalClients = [];
  let finalDiets = [];
  let finalConvos = [];
  let finalWorkouts = [];
  let finalCheckins = [];
  let finalUserCheckins = [];

  if (coach) {
    finalCoach = coach.toObject({ getters: true });
  }
  if (clients) {
    finalClients = clients.map((user) => user.toObject({ getters: true }));
  }
  if (diets) {
    finalDiets = diets
      .reverse()
      .map((diet) => diet.toObject({ getters: true }));
  }
  if (convos) {
    finalConvos = convos.map((convo) => convo.toObject({ getters: true }));
  }
  if (workouts) {
    finalWorkouts = workouts
      .reverse()
      .map((workout) => workout.toObject({ getters: true }));
  }
  if (checkins) {
    finalCheckins = checkins.map((checkin) =>
      checkin.toObject({ getters: true })
    );
  }
  if (userCheckins) {
    finalUserCheckins = userCheckins.map((checkin) =>
      checkin.toObject({ getters: true })
    );
  }

  ///////////////////////////////////////////////////////////////////////////

  res.json({

    code: code,
    clientTotals: clientTotals,
    workoutTotals: workoutTotals,
    dietTotals: dietTotals,
    checkinTotals: checkinTotals,
    coach: finalCoach,
    clients: finalClients,
    diets: finalDiets,
    convos: finalConvos,
    workouts: finalWorkouts,
    user: user.toObject({ getters: true }),
    name: user.name,
    age: user.age,
    gender: user.gender,
    checkins: finalCheckins,
    userCheckins: finalUserCheckins,
    notifications: user.notifications,
  });
};

exports.getAllUserData = getAllUserData;
exports.removeClient = removeClient;
exports.addClient = addClient;
exports.getClients = getClients;
exports.getAllUsers = getAllUsers;
exports.updateUser = updateUser;
exports.login = login;
exports.createUser = createUser;
exports.updateNotifications = updateNotifications;

exports.tempUpdate = tempUpdate;
