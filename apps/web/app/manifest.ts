import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#f7f9fb',
    description: 'Marketplace de aluguel de carros e motos entre pessoas.',
    display: 'standalone',
    lang: 'pt-BR',
    name: 'Riddy — Mobilidade entre pessoas',
    short_name: 'Riddy',
    start_url: '/',
    theme_color: '#f7f9fb',
  };
}
