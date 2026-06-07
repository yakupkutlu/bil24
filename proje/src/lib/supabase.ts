// Kaldırıldı — src/lib/api.ts kullanın
// Bu dosya yalnızca henüz migrate edilmemiş bileşenlerin derlenmesi için burada duruyor
export const supabase: any = {
  from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.reject('supabase kaldırıldı') }) }) }),
  auth: { getUser: async () => ({ data: { user: null }, error: null }) },
};
