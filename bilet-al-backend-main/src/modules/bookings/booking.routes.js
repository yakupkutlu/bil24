import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ADMIN_ROLES, BOX_OFFICE_ROLES } from '../../utils/constants.js';
import * as controller from './booking.controller.js';
import { cancelSchema, createBookingSchema, idSchema, listBookingsSchema } from './booking.validator.js';

const router = Router();
router.use(protect);
router.post('/', validate(createBookingSchema), controller.createBooking);
router.get('/my', validate(listBookingsSchema), controller.myBookings);
router.get('/', authorize(...ADMIN_ROLES, ...BOX_OFFICE_ROLES), validate(listBookingsSchema), controller.listBookings);
router.get('/:id', validate(idSchema), controller.getBooking);
router.patch('/:id/cancel', validate(cancelSchema), controller.cancelBooking);
router.patch('/:id/expire', authorize(...ADMIN_ROLES), validate(idSchema), controller.expireBooking);
export default router;
