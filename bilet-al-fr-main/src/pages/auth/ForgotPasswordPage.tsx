import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function ForgotPasswordPage() {
  return <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4"><Card className="w-full max-w-md"><CardContent className="p-8"><h1 className="font-serif text-4xl text-white">Şifremi unuttum</h1><p className="mt-2 text-white/60">E-posta adresini yaz; reset bağlantısı gönderilsin.</p><div className="mt-6 space-y-4"><Input label="E-posta" type="email" /><Button className="w-full">Reset linki gönder</Button></div></CardContent></Card></main>;
}
