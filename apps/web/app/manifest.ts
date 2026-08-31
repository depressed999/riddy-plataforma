import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#f7f9fb',
    description: 'Marketplace de aluguel de carros e motos entre pessoas.',
    display: 'standalone',
    icons: [
      {
        sizes: 'any',
        src: '/logo.png',
        type: 'image/png',
      },
    ],
    lang: 'pt-BR',
    name: 'Riddy — Mobilidade entre pessoas',
    short_name: 'Riddy',
    start_url: '/',
    theme_color: '#f7f9fb',
  };
}
