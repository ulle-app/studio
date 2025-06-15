'use client';

import { useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search as SearchIcon } from 'lucide-react';

interface RecipeSearchProps {
  onSearch: (query: string) => void;
}

export function RecipeSearch({ onSearch }: RecipeSearchProps) {
  const [query, setQuery] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  return (
    <div className="space-y-3 my-8 max-w-xl mx-auto">
      <Label htmlFor="recipe-search" className="block text-xl font-medium text-foreground sr-only"> {/* Visually hidden, but available for screen readers */}
        Search Your Recipes
      </Label>
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true"/>
        <Input
          type="search"
          id="recipe-search"
          aria-label="Search your saved recipes by name or ingredient"
          placeholder="Search recipes by name or ingredient..."
          value={query}
          onChange={handleInputChange}
          className="w-full pl-12 pr-4 py-3 text-base rounded-lg shadow-sm border-border focus:ring-2 focus:ring-accent focus:border-accent"
        />
      </div>
    </div>
  );
}
