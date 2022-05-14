const express = require('express')

const router = express.Router();

const userControllers = require('../controllers/user-controllers');

const { check } = require('express-validator')

const checkAuth = require('../middleware/check-auth')


router.post('/signup',
[
  check('email').not().isEmpty(),
  check('password').isLength({min: 6})
],
userControllers.createUser)

router.post('/login',
[
  check('email').not().isEmpty(),
  check('password').isLength({min: 6})
],
userControllers.login)

router.use(checkAuth)
//
// All routes under have to have a token

router.get('/', userControllers.getAllUsers);

router.get('/clients/:uid', userControllers.getClients)

router.get('/all/:uid', userControllers.getAllUserData)

router.patch('/temp/:uid', userControllers.tempUpdate)

router.patch('/notifications/:uid', userControllers.updateNotifications)

router.patch('/:uid', userControllers.updateUser)

router.patch('/add/:uid',
[
  check('givenUser').not().isEmpty()
],

userControllers.addClient)


router.patch('/remove/:uid',
[
  check('givenUser').not().isEmpty()
],

userControllers.removeClient)





module.exports = router;