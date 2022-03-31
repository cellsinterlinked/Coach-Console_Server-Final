const express = require('express')

const workoutControllers = require('../controllers/workout-controllers');

const router = express.Router();


const { check } = require('express-validator')


router.get('/:uid', workoutControllers.getWorkouts);

router.post('/', workoutControllers.createWorkout)

router.patch('/send', workoutControllers.sendWorkout)

router.patch('/edit', workoutControllers.editWorkout)

router.delete('/:wid', workoutControllers.deleteWorkout)

module.exports = router;