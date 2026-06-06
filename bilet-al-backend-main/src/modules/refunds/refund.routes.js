import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { FINANCE_ROLES } from '../../utils/constants.js';
import * as controller from './refund.controller.js';
import { createRefundSchema, idSchema, listRefundsSchema, rejectSchema } from './refund.validator.js';

const router = Router();
router.use(protect);
router.post('/', validate(createRefundSchema), controller.createRefund);
router.get('/', validate(listRefundsSchema), controller.listRefunds);
router.get('/:id', validate(idSchema), controller.getRefund);
router.patch('/:id/approve', authorize(...FINANCE_ROLES), validate(idSchema), controller.approveRefund);
router.patch('/:id/reject', authorize(...FINANCE_ROLES), validate(rejectSchema), controller.rejectRefund);
router.patch('/:id/process', authorize(...FINANCE_ROLES), validate(idSchema), controller.processRefund);
export default router;
