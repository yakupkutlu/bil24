import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ADMIN_ROLES, ROLES } from '../../utils/constants.js';
import * as controller from './user.controller.js';
import { idSchema, listUsersSchema, roleSchema, statusSchema, updateUserSchema } from './user.validator.js';

const router = Router();
router.use(protect, authorize(...ADMIN_ROLES));
router.get('/', validate(listUsersSchema), controller.listUsers);
router.get('/:id', validate(idSchema), controller.getUser);
router.put('/:id', validate(updateUserSchema), controller.updateUser);
router.delete('/:id', validate(idSchema), controller.deleteUser);
router.patch('/:id/status', validate(statusSchema), controller.changeStatus);
router.patch('/:id/role', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(roleSchema), controller.changeRole);
export default router;
