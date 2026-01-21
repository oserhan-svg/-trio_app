const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// All user management routes are admin-only
router.use(authenticateToken);
router.use(authorizeRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
