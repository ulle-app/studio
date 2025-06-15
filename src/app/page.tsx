// @ts-nocheck
// TODO: Fix this file
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { IngredientForm } from '@/components/forms/IngredientForm';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeSearch } from '@/components/recipe/RecipeSearch';
import { RecipeList } from '@/components/recipe/RecipeList';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { handleGenerateRecipeAction } from './actions';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import useLocalStorage from '@/hooks/use-local-storage';
import { useToast } from "@/hooks/use-toast";
import { ChefHat, BookOpen, History, EyeIcon, Utensils } from 'lucide-react';

export default function HomePage() {
  const [currentRecipe, setCurrentRecipe] = useState<GenerateRecipeOutput | null>(null);
  
  const initialRecipes = useMemo(() => [], []);
  const [allRecipes, setAllRecipes] = useLocalStorage<GenerateRecipeOutput[]>('recipeFeastRecipes', initialRecipes);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingAllRecipes, setViewingAllRecipes] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
    console.log('[HomePage] Client loaded state set to true.');
  }, []);


  const { toast } = useToast();

  const handleRecipeGenerated = useCallback((recipe: GenerateRecipeOutput) => {
    console.log('[HomePage] handleRecipeGenerated called with:', recipe);
    setCurrentRecipe(recipe);
    setAllRecipes(prevRecipes => {
      const recipeSignature = `${recipe.recipeName}-${recipe.instructions?.substring(0, 20) ?? ''}`;
      const isDuplicate = prevRecipes.some(r => `${r.recipeName}-${r.instructions?.substring(0,20) ?? ''}` === recipeSignature);
      if (isDuplicate) { 
        console.log('[HomePage] Duplicate recipe detected, moving to top.');
        return [recipe, ...prevRecipes.filter(r => `${r.recipeName}-${r.instructions?.substring(0,20) ?? ''}` !== recipeSignature)];
      }
      console.log('[HomePage] Adding new recipe to allRecipes.');
      return [recipe, ...prevRecipes];
    });
    setViewingAllRecipes(false);
    setSearchQuery('');
    
    toast({
      title: "Voilà! Recipe Generated!",
      description: (
        <div className="flex items-center">
          <Utensils className="h-5 w-5 mr-2 text-accent" />
          <span>Your recipe for "{recipe.recipeName}" is ready.</span>
        </div>
      ),
      duration: 6000,
    });
  }, [setCurrentRecipe, setAllRecipes, setViewingAllRecipes, setSearchQuery, toast]);

  const handleGenerationError = useCallback((message: string) => {
    console.error('[HomePage] handleGenerationError called with message:', message);
    toast({
      variant: "destructive",
      title: "Oops! Something went wrong.",
      description: message || "Failed to generate recipe. Please try again.",
      duration: 8000,
    });
  }, [toast]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return allRecipes;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allRecipes.filter(recipe =>
      recipe.recipeName.toLowerCase().includes(lowerCaseQuery) ||
      (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [allRecipes, searchQuery]);

  const recipesToDisplay = searchQuery ? filteredRecipes : allRecipes;

  if (!clientLoaded) {
    console.log('[HomePage] Client not loaded yet, rendering loading state.');
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <AppHeader />
        <main className="container mx-auto px-4 pb-16 flex-grow flex items-center justify-center">
          <ChefHat className="h-24 w-24 animate-pulse text-primary/50" />
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />
      <main className="container mx-auto px-4 pb-16 flex-grow mt-8">
        <section id="generator" aria-labelledby="generator-heading" className="mb-12 p-6 sm:p-8 bg-card rounded-xl shadow-lg border border-border/20">
          <h2 id="generator-heading" className="sr-only">Recipe Generator</h2>
          <IngredientForm
            formAction={handleGenerateRecipeAction}
            onRecipeGenerated={handleRecipeGenerated}
            onError={handleGenerationError}
          />
        </section>

        {currentRecipe && !viewingAllRecipes && (
          <section id="current-recipe" aria-labelledby="current-recipe-heading" className="mb-12 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 id="current-recipe-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
                Your Latest Creation
              </h2>
              {allRecipes.length > 0 && (
                <Button variant="outline" onClick={() => { setViewingAllRecipes(true); setSearchQuery(''); }} className="w-full sm:w-auto">
                  <History className="mr-2 h-4 w-4" />
                  View Recipe History
                </Button>
              )}
            </div>
            <RecipeCard recipe={currentRecipe} />
          </section>
        )}
        
        {(viewingAllRecipes || (!currentRecipe && allRecipes.length > 0)) && (
          <>
            <Separator className="my-12 bg-border/50" />
            <section id="recipe-collection" aria-labelledby="recipe-collection-heading" className="animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
                <h2 id="recipe-collection-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
                  Recipe History
                </h2>
                {currentRecipe && viewingAllRecipes && (
                   <Button variant="outline" onClick={() => setViewingAllRecipes(false)} className="w-full sm:w-auto">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      View Latest Recipe
                    </Button>
                )}
              </div>
              <RecipeSearch onSearch={setSearchQuery} />
              <RecipeList
                recipes={recipesToDisplay}
                emptyStateMessage={searchQuery ? "No recipes match your search." : "Your recipe history is empty. Generate some recipes!"}
              />
            </section>
          </>
        )}

        {!currentRecipe && allRecipes.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-xl shadow-sm p-8 mt-8 border border-border/30">
            <BookOpen className="mx-auto h-20 w-20 mb-6 text-primary/60" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to Recipe Feast!</h2>
            <p className="text-lg mb-1">Ready to discover delicious Indian meals?</p>
            <p>Enter your ingredients above and let the magic happen.</p>
          </div>
        )}
      </main>
      <footer className="py-6 border-t border-border/30 text-center text-muted-foreground text-sm bg-card mt-auto">
          <p>&copy; {new Date().getFullYear()} Recipe Feast. Happy Cooking!</p>
      </footer>
    </div>
  );
}
