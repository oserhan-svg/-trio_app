const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth.authenticateToken, agendaController.getAgendaItems);
router.post('/', auth.authenticateToken, agendaController.createAgendaItem);
router.put('/:id', auth.authenticateToken, agendaController.updateAgendaItem);
router.delete('/:id', auth.authenticateToken, agendaController.deleteAgendaItem);

module.exports = router;
