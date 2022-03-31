const express = require('express')
const checkinControllers = require('../controllers/checkin-controllers');

const router = express.Router();
const { check } = require('express-validator')

router.get('/:uid', checkinControllers.getCheckins)

router.post('/', checkinControllers.createCheckin)

router.delete('/', checkinControllers.deleteCheckin)

module.exports = router;