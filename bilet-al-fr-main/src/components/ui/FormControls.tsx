import type { InputHTMLAttributes } from 'react';
import { Input } from './Input';

export function DatePicker(props: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <Input type="date" {...props} />;
}

export function TimePicker(props: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <Input type="time" {...props} />;
}

export function ImageUpload({ label = 'Görsel yükle' }: { label?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-theater-gold/40 bg-white/5 p-8 text-center text-sm text-white/65 hover:bg-white/10">
      <span>{label}</span>
      <input type="file" accept="image/*" className="hidden" />
    </label>
  );
}
