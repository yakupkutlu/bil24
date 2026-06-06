import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { optionalAuth, protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { EVENT_MANAGER_ROLES } from '../../utils/constants.js';
import * as controller from './event.controller.js';
import { createEventSchema, idSchema, listEventsSchema, slugSchema, statusSchema, updateEventSchema } from './event.validator.js';

const router = Router();
router.get('/', optionalAuth, validate(listEventsSchema), controller.listEvents);
router.get('/:slug', optionalAuth, validate(slugSchema), controller.getEvent);
router.post('/', protect, authorize(...EVENT_MANAGER_ROLES), validate(createEventSchema), controller.createEvent);
router.put('/:id', protect, authorize(...EVENT_MANAGER_ROLES), validate(updateEventSchema), controller.updateEvent);
router.delete('/:id', protect, authorize(...EVENT_MANAGER_ROLES), validate(idSchema), controller.deleteEvent);
router.patch('/:id/status', protect, authorize(...EVENT_MANAGER_ROLES), validate(statusSchema), controller.changeStatus);
export default router;
