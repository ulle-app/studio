
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CookingPot, ChefHat, Loader2, CameraOff } from 'lucide-react';
import Image from 'next/image';

interface RecipeCardProps {
  recipe: GenerateRecipeOutput | null; // Can be null if no recipe is active
  isGeneratingImage?: boolean;
}

export function RecipeCard({ recipe, isGeneratingImage }: RecipeCardProps) {
  if (!recipe) {
    // Optionally render a placeholder or message if no recipe is selected to display
    return (
        <Card className="w-full shadow-lg border-border/20 rounded-xl overflow-hidden bg-card">
            <CardHeader className="pb-4 bg-muted/[.07] p-6 border-b border-border/20">
                 <div className="flex items-center gap-3 sm:gap-4">
                    <ChefHat className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-xl sm:text-2xl font-headline text-muted-foreground">Select a recipe to view details</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>No recipe selected, or details are loading.</p>
            </CardContent>
        </Card>
    );
  }

  const displayImage = recipe.imageDataUri;

  return (
    <Card className="w-full shadow-xl border-primary/20 rounded-xl overflow-hidden bg-card">
      <CardHeader className="pb-4 bg-primary/[.07] p-6 border-b border-primary/20">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <ChefHat className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0 mt-1 sm:mt-0" aria-hidden="true"/>
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary leading-tight">{recipe.recipeName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        {isGeneratingImage && !displayImage && (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-muted/50 aspect-video" data-ai-hint="food cooking">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground text-center">Generating recipe image...</p>
          </div>
        )}
        {!isGeneratingImage && displayImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md border border-border">
            <Image 
              src={displayImage} 
              alt={`Image of ${recipe.recipeName}`} 
              layout="fill" 
              objectFit="cover"
              className="transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              onLoadingComplete={(image) => image.classList.remove('opacity-0')}
              data-ai-hint="indian food" // Generic hint for generated images
            />
          </div>
        )}
        {!isGeneratingImage && !displayImage && (
           <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-muted/50 aspect-video" data-ai-hint="food plate">
            <CameraOff className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">No image available for this recipe.</p>
          </div>
        )}

        <div>
          <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground mb-4">
            <ListChecks className="mr-3 h-6 w-6 text-accent flex-shrink-0" aria-hidden="true"/>
            Ingredients
          </h3>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <ul role="list" className="list-disc list-inside space-y-1.5 text-foreground/90 pl-4 text-base">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="break-words">{ingredient}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic ml-4">This recipe primarily uses common kitchen staples.</p>
          )}
        </div>
        <div>
          <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground mb-4">
            <CookingPot className="mr-3 h-6 w-6 text-accent flex-shrink-0" aria-hidden="true"/>
            Instructions
          </h3>
          <div className="space-y-3 text-foreground/90 whitespace-pre-line text-base leading-relaxed">
            {recipe.instructions.split('\n').map((line, index) => (
              line.trim() ? <p key={index} className="break-words">{line}</p> : null
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

