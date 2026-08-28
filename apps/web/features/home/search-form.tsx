import { CalendarDays, MapPin, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchForm() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <form
        action="/buscar"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_auto]"
        method="get"
      >
        <div className="relative">
          <label className="sr-only" htmlFor="search-location">
            Local de retirada
          </label>
          <MapPin
            aria-hidden="true"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            className="h-14 border-transparent bg-muted pr-4 pl-12 focus-visible:bg-card"
            id="search-location"
            name="location"
            placeholder="Onde você quer retirar?"
            required
          />
        </div>

        <div className="relative">
          <label className="sr-only" htmlFor="search-date">
            Data de retirada
          </label>
          <CalendarDays
            aria-hidden="true"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            className="h-14 border-transparent bg-muted pr-4 pl-12 focus-visible:bg-card"
            id="search-date"
            name="pickupDate"
            required
            type="date"
          />
        </div>

        <Button className="h-14 px-7" size="lg" type="submit">
          <Search aria-hidden="true" size={19} />
          Buscar
        </Button>
      </form>
    </div>
  );
}
