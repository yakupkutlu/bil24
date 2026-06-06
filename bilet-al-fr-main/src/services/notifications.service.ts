import { api, unwrap } from './api'; import type { Notification } from '@/types';
export const notificationsService={list:()=>api.get('/notifications').then(unwrap<Notification[]>),markRead:(id:string)=>api.patch(`/notifications/${id}/read`).then(unwrap<Notification>),campaign:(payload:{title:string;message:string;role?:string})=>api.post('/notifications/campaign',payload).then(unwrap)};
