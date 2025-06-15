
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { RecipeCard } from './RecipeCard';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added
import { Eye } from 'lucide-react'; // Added

interface RecipeListProps {
  recipes: GenerateRecipeOutput[];
  emptyStateMessage?: string;
  onViewRecipe: (recipe: GenerateRecipeOutput) => void; // Added callback
}

export function RecipeList({ recipes, emptyStateMessage = "No recipes found. Try generating some!", onViewRecipe }: RecipeListProps) {
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
        <div key={`${recipe.recipeName}-${index}-${recipe.instructions?.slice(0, 15) ?? 'no-instr'}`} className="relative group">
          <RecipeCard recipe={recipe} />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 hover:bg-card"
            onClick={() => onViewRecipe(recipe)}
            aria-label={`View details for ${recipe.recipeName}`}
          >
            <Eye className="mr-2 h-4 w-4" /> View
          </Button>
        </div>
      ))}
    </div>
  );
}
