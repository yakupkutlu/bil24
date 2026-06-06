import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function ResetPasswordPage() {
  return <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4"><Card className="w-full max-w-md"><CardContent className="p-8"><h1 className="font-serif text-4xl text-white">Yeni şifre</h1><div className="mt-6 space-y-4"><Input label="Yeni şifre" type="password" /><Input label="Şifre tekrar" type="password" /><Button className="w-full">Şifreyi güncelle</Button></div></CardContent></Card></main>;
}
