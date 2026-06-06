import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export function AdminSectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
