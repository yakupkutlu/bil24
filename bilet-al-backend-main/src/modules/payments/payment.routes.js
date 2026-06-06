import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { FINANCE_ROLES } from '../../utils/constants.js';
import * as controller from './payment.controller.js';
import { callbackSchema, checkoutSchema, idSchema, listPaymentsSchema } from './payment.validator.js';

const router = Router();
router.post('/iyzico/callback', validate(callbackSchema), controller.iyzicoCallback);
router.get('/iyzico/callback', validate(callbackSchema), controller.iyzicoCallback);
router.post('/callback', validate(callbackSchema), controller.callback);
router.get('/callback', validate(callbackSchema), controller.callback);
router.use(protect);
router.post('/checkout', validate(checkoutSchema), controller.checkout);
router.get('/', authorize(...FINANCE_ROLES), validate(listPaymentsSchema), controller.listPayments);
router.get('/:id/status', validate(idSchema), controller.paymentStatus);
router.get('/:id', validate(idSchema), controller.getPayment);
export default router;
