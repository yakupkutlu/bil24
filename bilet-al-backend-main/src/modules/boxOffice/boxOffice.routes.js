import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { BOX_OFFICE_ROLES } from '../../utils/constants.js';
import * as controller from './boxOffice.controller.js';
import { sellTicketSchema } from './boxOffice.validator.js';

const router = Router();
router.use(protect, authorize(...BOX_OFFICE_ROLES));
router.post('/sell-ticket', validate(sellTicketSchema), controller.sellTicket);
export default router;
