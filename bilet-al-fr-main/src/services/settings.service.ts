import { api, unwrap } from './api'; import type { SistemSettings } from '@/types';
export const settingsService={get:()=>api.get('/settings').then(unwrap<SistemSettings>),update:(payload:Partial<SistemSettings>)=>api.put('/settings',payload).then(unwrap<SistemSettings>)};
