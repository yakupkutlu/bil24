import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { EVENT_MANAGER_ROLES } from '../../utils/constants.js';
import * as controller from './showtime.controller.js';
import { createShowtimeSchema, eventShowtimesSchema, idSchema, listShowtimesSchema, statusSchema, updateShowtimeSchema } from './showtime.validator.js';

const router = Router();
router.get('/', validate(listShowtimesSchema), controller.listShowtimes);
router.get('/event/:eventId/list', validate(eventShowtimesSchema), controller.eventShowtimes);
router.get('/:id', validate(idSchema), controller.getShowtime);
router.post('/', protect, authorize(...EVENT_MANAGER_ROLES), validate(createShowtimeSchema), controller.createShowtime);
router.put('/:id', protect, authorize(...EVENT_MANAGER_ROLES), validate(updateShowtimeSchema), controller.updateShowtime);
router.delete('/:id', protect, authorize(...EVENT_MANAGER_ROLES), validate(idSchema), controller.deleteShowtime);
router.patch('/:id/status', protect, authorize(...EVENT_MANAGER_ROLES), validate(statusSchema), controller.changeStatus);
export default router;
