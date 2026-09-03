'use client';

import { Bike, CarFront, Images } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { publicVehicleImageUrl } from '@/lib/vehicle-image-url';
import type { Vehicle } from '@/features/marketplace/marketplace.types';

export function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const orderedImages = [...vehicle.images].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = orderedImages[selectedIndex];

  if (!selectedImage) {
    const Icon = vehicle.type === 'car' ? CarFront : Bike;

    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground sm:aspect-[16/8]">
        <Icon aria-hidden="true" size={60} strokeWidth={1.25} />
        <p className="mt-4 font-heading text-sm font-medium tracking-wide uppercase">
          Galeria em atualização
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Galeria do veículo">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted sm:aspect-[16/8]">
        <Image
          alt={selectedImage.altText}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1400px"
          src={publicVehicleImageUrl(selectedImage)}
        />
        <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-md bg-slate-950/75 px-3 py-2 font-heading text-xs font-medium text-white">
          <Images aria-hidden="true" size={15} />
          {selectedIndex + 1} de {orderedImages.length}
        </span>
      </div>

      {orderedImages.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {orderedImages.map((image, index) => (
            <button
              aria-label={`Exibir imagem ${index + 1}`}
              aria-pressed={index === selectedIndex}
              className={cn(
                'relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md border-2 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                index === selectedIndex
                  ? 'border-primary-strong'
                  : 'border-transparent hover:border-border',
              )}
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="112px"
                src={publicVehicleImageUrl(image)}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
