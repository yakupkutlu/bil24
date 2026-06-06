import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';
import * as controller from './seat.controller.js';
import { holdSeatsSchema, releaseSeatsSchema, showtimeSeatsSchema } from './seat.validator.js';

const router = Router();
router.get('/showtimes/:id/seats', validate(showtimeSeatsSchema), controller.getSeats);
router.post('/showtimes/:id/hold-seats', optionalAuth, validate(holdSeatsSchema), controller.holdSeats);
router.post('/showtimes/:id/release-seats', optionalAuth, validate(releaseSeatsSchema), controller.releaseSeats);
export default router;
