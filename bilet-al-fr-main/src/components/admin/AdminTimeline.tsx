export interface AdminTimelineItem { title: string; meta: string; status?: string }
export function AdminTimeline({ items }: { items: AdminTimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="relative flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-theater-gold shadow-glow" />
            {index < items.length - 1 && <span className="h-full min-h-10 w-px bg-white/10" />}
          </div>
          <div className="min-w-0 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-white">{item.title}</p>
              {item.status && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/55">{item.status}</span>}
            </div>
            <p className="mt-1 text-sm text-white/45">{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
