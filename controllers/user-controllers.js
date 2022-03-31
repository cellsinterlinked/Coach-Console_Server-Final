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

const createUser = async (req, res, next) => {
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

  const { password, email, role } = req.body;
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

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('creashed while creating hashed password', 500);
    return next(error);
  }

  const createdUser = new User({
    email,
    password: hashedPassword,
    role,
    workouts: [],
    image: '',
    workouts: [],
    name: '',
    diets: [],
    conversations: [],
    clients: [],
    coach: [],
    gender: 0,
    age: 0,
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
      { userId: createdUser.id, email: createdUser.email },
      'supersecret_dont-share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Creating user failed 2 ', 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
    userName: createdUser.userName,
  });
};

const login = async (req, res, next) => {
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
      { userId: existingUser.id, email: existingUser.email, role: existingUser.role },
      'supersecret_dont_share',
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

const updateUser = async (req, res, next) => {
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
      console.log(uploadedResponse);
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

  // if (image) {
  //   try {
  //     cloudinary.uploader.add_tag(userId, newPublicId, function(error,result) {
  //       console.log(`this is result ${result}, and this is error ${error}`) });

  //   } catch(err) {
  //    const error = new HttpError('Cloudinary hates you', 500)
  //    return next(error)

  //   }

  //  potentially do all cloudinary on back end?

  // need to check token to see if it belongs to this user!

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

  res.json({ users: clients.map((user) => user.toObject({ getters: true })) });
};

const addClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // if there are errors
    console.log(errors);
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
    // if there are errors
    console.log(errors);
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
    // if there are errors
    console.log(errors);
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

  let coach;
  // checkins for clients?

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('You dont exist', 500);
    return next(error);
  }

  let coachId = user.coach[0]

  if (user.role === 'Client') {
    try {
      coach = await User.findById(coachId)
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

  ///////////////////////////////////////////////////////////////////////////


  res.json({
    coach: coach.toObject({getters: true}),


    clients: clients.map((user) => user.toObject({ getters: true })),
    diets: diets.map((diet) => diet.toObject({ getters: true })),
    convos: convos.map((convo) => convo.toObject({ getters: true })),
    workouts: workouts
      .reverse()
      .map((workout) => workout.toObject({ getters: true })),
    user: user.toObject({ getters: true }),
    checkins: checkins.map((checkin) => checkin.toObject({ getters: true })),
    //////////////////////////////////////////////////////////////////////////////////
    userCheckins: userCheckins.map((checkin) => checkin.toObject({ getters: true}))
    //////////////////////////////////////////////////////////////////////////////
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
