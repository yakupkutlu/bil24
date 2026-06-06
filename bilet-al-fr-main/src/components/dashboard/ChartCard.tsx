import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export function ChartCard({ title, children, description }: { title: string; children: ReactNode; description?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
          </div>
          <span className="h-2 w-2 rounded-full bg-theater-gold shadow-glow" />
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
