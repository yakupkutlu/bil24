import type { Role } from '@/types';
export const ROLES: Role[] = ['CUSTOMER','BOX_OFFICE','EVENT_MANAGER','FINANCE','ADMIN','SUPER_ADMIN'];
export const ADMIN_ROLES: Role[] = ['EVENT_MANAGER','FINANCE','ADMIN','SUPER_ADMIN'];
export const STAFF_ROLES: Role[] = ['BOX_OFFICE','EVENT_MANAGER','FINANCE','ADMIN','SUPER_ADMIN'];
export const roleHome: Record<Role,string> = {CUSTOMER:'/customer/dashboard',BOX_OFFICE:'/box-office/dashboard',EVENT_MANAGER:'/admin/events',FINANCE:'/admin/payments',ADMIN:'/admin/dashboard',SUPER_ADMIN:'/admin/dashboard'};
