import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ADMIN_ROLES } from '../../utils/constants.js';
import * as controller from './hall.controller.js';
import { createHallSchema, generateSeatsSchema, idSchema, listHallsSchema, updateHallSchema, updateSeatsSchema } from './hall.validator.js';

const router = Router();
router.use(protect, authorize(...ADMIN_ROLES));
router.get('/', validate(listHallsSchema), controller.listHalls);
router.get('/:id', validate(idSchema), controller.getHall);
router.post('/', validate(createHallSchema), controller.createHall);
router.put('/:id', validate(updateHallSchema), controller.updateHall);
router.delete('/:id', validate(idSchema), controller.deleteHall);
router.post('/:id/generate-seats', validate(generateSeatsSchema), controller.generateSeats);
router.put('/:id/seats', validate(updateSeatsSchema), controller.updateSeats);
export default router;
