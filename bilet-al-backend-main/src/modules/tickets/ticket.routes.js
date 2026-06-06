import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { BOX_OFFICE_ROLES } from '../../utils/constants.js';
import * as controller from './ticket.controller.js';
import { idSchema, listTicketsSchema, verifySchema } from './ticket.validator.js';

const router = Router();
router.use(protect);
router.get('/my', validate(listTicketsSchema), controller.myTickets);
router.get('/', validate(listTicketsSchema), controller.listTickets);
router.post('/verify', authorize(...BOX_OFFICE_ROLES), validate(verifySchema), controller.verifyTicket);
router.get('/:id/download', validate(idSchema), controller.downloadTicket);
router.get('/:id', validate(idSchema), controller.getTicket);
router.post('/:id/mark-used', authorize(...BOX_OFFICE_ROLES), validate(idSchema), controller.markUsed);
router.post('/:id/resend-email', validate(idSchema), controller.resendEmail);
export default router;
