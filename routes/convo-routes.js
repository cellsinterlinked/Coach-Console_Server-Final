const express = require('express');

const router = express.Router();

const convoControllers = require('../controllers/convo-controllers');

const { check } = require('express-validator');

router.get(
  '/:uid',
  [check('role').custom((val) => val === 'client' || 'coach')],
  convoControllers.getConvos
);

router.patch(
  '/add/:uid',
  [
    check('role').custom((val) => val === 'client' || 'coach'),
    //more validation whenever you figure it out
  ],
  convoControllers.updateAddConvo
);

router.patch(
  '/notifications/:uid',
  [check('role').custom((val) => val === 'client' || 'coach')],
  convoControllers.updateConvoNotifications
);

router.patch(
  '/delete/:uid',
  [check('role').custom((val) => val === 'client' || 'coach')],
  convoControllers.updateDeleteConvo
);

module.exports = router;
