const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.createChat);
router.get('/', chatController.getChats);
router.get('/:id', chatController.getChatById);

module.exports = router;