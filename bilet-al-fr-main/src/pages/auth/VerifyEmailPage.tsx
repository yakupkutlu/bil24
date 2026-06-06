import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export function VerifyEmailPage() {
  return <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4"><Card className="w-full max-w-md"><CardContent className="p-8 text-center"><MailCheck className="mx-auto h-16 w-16 text-theater-gold" /><h1 className="mt-4 font-serif text-4xl text-white">E-posta doğrulama</h1><p className="mt-2 text-white/60">Doğrulama başarılı. Artık giriş yapabilirsin.</p><Button asChild className="mt-6"><Link to="/login">Giriş yap</Link></Button></CardContent></Card></main>;
}
