import express from 'express';
import {
  getAllAppointments,
  getAppointmentsByClient,
  getAppointmentsByBarber,
  getAppointmentsByShop,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointmentsByClientAndStatus
} from '../controllers/appointmentController.js';

const router = express.Router();

// Rutas para citas
router.get('/', getAllAppointments);
router.get('/client/:clientId', getAppointmentsByClient);
router.get('/barber/:barberId', getAppointmentsByBarber);
router.get('/shop/:shopId', getAppointmentsByShop);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.put('/:id/cancel', cancelAppointment);
router.delete('/client/:clientId', deleteAppointmentsByClientAndStatus);

export default router;
