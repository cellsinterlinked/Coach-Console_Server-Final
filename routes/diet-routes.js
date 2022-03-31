const express = require('express')
const dietControllers = require('../controllers/diet-controllers');

const router = express.Router();

router.get('/:uid', dietControllers.getDiets);

router.post('/', dietControllers.createDiet)

router.patch('/edit', dietControllers.editDiet)

router.patch('/send', dietControllers.sendDiet)

router.delete('/:did', dietControllers.deleteDiet)

module.exports = router;