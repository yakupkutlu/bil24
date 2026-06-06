import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ADMIN_ROLES } from '../../utils/constants.js';
import * as controller from './settings.controller.js';
import { updateSettingsSchema } from './settings.validator.js';

const router = Router();
router.get('/', controller.getSettings);
router.put('/', protect, authorize(...ADMIN_ROLES), validate(updateSettingsSchema), controller.updateSettings);
export default router;
