import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ADMIN_ROLES } from '../../utils/constants.js';
import * as controller from './notification.controller.js';
import { campaignSchema, idSchema, listNotificationsSchema } from './notification.validator.js';

const router = Router();
router.use(protect);
router.get('/', validate(listNotificationsSchema), controller.listNotifications);
router.patch('/:id/read', validate(idSchema), controller.markRead);
router.post('/campaign', authorize(...ADMIN_ROLES), validate(campaignSchema), controller.campaign);
export default router;
