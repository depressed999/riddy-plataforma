import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/container';
import { RiddyLogo } from '@/components/layout/riddy-logo';

const footerLinks = [
  { href: '/#termos', label: 'Termos de uso' },
  { href: '/#privacidade', label: 'Privacidade' },
  { href: '/#ajuda', label: 'Ajuda' },
  { href: '/#contato', label: 'Contato' },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted">
      <Container className="flex flex-col gap-8 py-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" aria-label="Página inicial">
  <Image
    src="/riddy-logo-wordmark.png"       
    alt="Logo"
    width={130}
    height={36}
    className="h-19 w-auto object-contain"
  />
  
</Link>


        <nav
          aria-label="Links institucionais"
          className="flex flex-wrap gap-x-6 gap-y-3"
        >
          {footerLinks.map((link) => (
            <Link
              className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Riddy. Todos os direitos reservados.
        </p>
      </Container>
    </footer>
  );
}
