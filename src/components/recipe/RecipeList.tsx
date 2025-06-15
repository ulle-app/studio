import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { RecipeCard } from './RecipeCard';
import { UtensilsCrossed } from 'lucide-react';

interface RecipeListProps {
  recipes: GenerateRecipeOutput[];
  emptyStateMessage?: string;
}

export function RecipeList({ recipes, emptyStateMessage = "No recipes found. Try generating some!" }: RecipeListProps) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-xl shadow-sm p-8 border border-border/30">
        <UtensilsCrossed className="mx-auto h-16 w-16 mb-6 text-primary/60" aria-hidden="true" />
        <p className="text-lg font-medium">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {recipes.map((recipe, index) => (
        // Using a combination of name, index, and a snippet of instructions for a more robust key.
        // In a real DB scenario, a unique ID would be ideal.
        <RecipeCard key={`${recipe.recipeName}-${index}-${recipe.instructions?.slice(0, 15) ?? 'no-instr'}`} recipe={recipe} />
      ))}
    </div>
  );
}
