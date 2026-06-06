import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import * as controller from './profile.controller.js';
import { updatePasswordSchema, updatePreferencesSchema, updateProfileSchema } from './profile.validator.js';

const router = Router();
router.use(protect);
router.get('/', controller.getProfile);
router.put('/', validate(updateProfileSchema), controller.updateProfile);
router.put('/password', validate(updatePasswordSchema), controller.updatePassword);
router.put('/preferences', validate(updatePreferencesSchema), controller.updatePreferences);
export default router;
