import { Soup } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 mb-8 border-b border-border/50 shadow-sm bg-card sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3 px-4">
        <Soup className="h-10 w-10 text-primary flex-shrink-0" aria-hidden="true" />
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary truncate">
          Fridge Feast
        </h1>
      </div>
    </header>
  );
}
