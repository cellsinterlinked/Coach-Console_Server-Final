const express = require('express')
const checkinControllers = require('../controllers/checkin-controllers');

const router = express.Router();
const { check } = require('express-validator')

router.delete('/:cid', checkinControllers.deleteCheckin)

router.get('/:uid', checkinControllers.getCheckins)

router.post('/', checkinControllers.createCheckin)


module.exports = router;