import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div
      aria-live="polite"
      className="grid min-h-[40vh] place-items-center px-6 py-16 text-muted-foreground"
      role="status"
    >
      <span className="inline-flex items-center gap-3 font-heading text-sm font-medium">
        <Loader2 aria-hidden="true" className="animate-spin" size={20} />
        Carregando conteúdo…
      </span>
    </div>
  );
}
