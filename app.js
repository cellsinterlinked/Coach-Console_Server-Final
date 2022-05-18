const express = require('express')
const bodyParser = require('body-parser')
const userRoutes = require('./routes/user-routes')
const dietRoutes = require('./routes/diet-routes');
const workoutRoutes = require('./routes/workout-routes');
const convoRoutes = require('./routes/convo-routes');
const checkinRoutes = require('./routes/checkin-routes');
const mongoose = require('mongoose');
const HttpError = require('./models/http-error');

const app = express();

app.use(express.json({ limit: '50mb', extended: true}))
app.use(express.urlencoded({ limit: '50mb', extended: true}))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  next();
})


app.use('/api/users', userRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/convos', convoRoutes);
app.use('/api/checkins', checkinRoutes)


app.use((res, req, next) => {   // this is a catch all for unsupported routes if they send a request to a route that isn't listed above ^
  const error = new HttpError('Could not find this route.', 404);
  throw error;
})

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500)
  res.json({message: error.message || 'An unknown error occurred!'})

})


mongoose
.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nbxmp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
.then(() => {
  app.listen(5000);
})
.catch(err => {
  console.log(err)
})






