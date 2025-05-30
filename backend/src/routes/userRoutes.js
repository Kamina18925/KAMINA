import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser
} from '../controllers/userController.js';
import { verifySession } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/', createUser); // Registro de usuarios

// Rutas protegidas (requieren autenticación)
router.get('/', verifySession, getAllUsers);
router.get('/:id', verifySession, getUserById);
router.put('/:id', verifySession, updateUser);
router.delete('/:id', verifySession, deleteUser);

export default router;
