import { ReactNode, useState } from 'react';
import { Button } from './Button';

type TabConfig = string | { label: string; content: ReactNode };

export function Tabs({ tabs, children }: { tabs: TabConfig[]; children?: ReactNode }) {
  const [active, setActive] = useState(0);
  const labels = tabs.map((tab) => typeof tab === 'string' ? tab : tab.label);
  const currentContent = typeof tabs[active] === 'string' ? children : tabs[active]?.content;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {labels.map((label, index) => (
          <Button key={label} size="sm" variant={index === active ? 'gold' : 'secondary'} onClick={() => setActive(index)}>{label}</Button>
        ))}
      </div>
      <div>{currentContent}</div>
    </div>
  );
}
