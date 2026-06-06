import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ADMIN_ROLES } from '../../utils/constants.js';
import * as controller from './dashboard.controller.js';
const router = Router();
router.get('/', protect, authorize(...ADMIN_ROLES), controller.getDashboard);
export default router;
