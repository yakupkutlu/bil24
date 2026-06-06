import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/ToastProvider';

export function useAdminMutation<TPayload, TResult>(options: {
  mutationFn: (payload: TPayload) => Promise<TResult>;
  successMessage: string;
  errorMessage?: string;
  invalidate?: readonly unknown[];
  onSuccess?: (data: TResult) => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: (data) => {
      showToast(options.successMessage, 'success');
      if (options.invalidate) queryClient.invalidateQueries({ queryKey: options.invalidate });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-halls'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : options.errorMessage ?? 'Admin işlemi başarısız oldu.';
      showToast(message, 'error');
    }
  });
}
