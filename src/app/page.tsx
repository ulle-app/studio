
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
import { handleGenerateRecipeAction, handleTranslateRecipeAction } from './actions';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { TranslateRecipeOutput } from '@/ai/flows/translate-recipe';
import useLocalStorage from '@/hooks/use-local-storage';
import { useToast } from "@/hooks/use-toast";
import { ChefHat, BookOpen, History, EyeIcon, Utensils, Languages, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [currentEnglishRecipe, setCurrentEnglishRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [currentHindiRecipe, setCurrentHindiRecipe] = useState<TranslateRecipeOutput | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hi'>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const initialRecipes = useMemo(() => [], []);
  const [allRecipes, setAllRecipes] = useLocalStorage<GenerateRecipeOutput[]>('jhatpatRecipes', initialRecipes);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingAllRecipes, setViewingAllRecipes] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
    console.log('[HomePage] Client loaded state set to true.');
  }, []);

  const { toast } = useToast();

  const handleRecipeGenerated = useCallback(async (recipe: GenerateRecipeOutput) => {
    console.log('[HomePage] handleRecipeGenerated called. Recipe Name (EN):', recipe.recipeName);
    setCurrentEnglishRecipe(recipe);
    setCurrentHindiRecipe(null); 
    setCurrentLanguage('en'); 
    setAllRecipes(prevRecipes => {
      const recipeSignature = `${recipe.recipeName}-${recipe.instructions?.substring(0, 20) ?? ''}`;
      const isDuplicate = prevRecipes.some(r => `${r.recipeName}-${r.instructions?.substring(0,20) ?? ''}` === recipeSignature);
      if (isDuplicate) { 
        console.log('[HomePage] Duplicate recipe detected, moving to top.');
        return [recipe, ...prevRecipes.filter(r => `${r.recipeName}-${r.instructions?.substring(0,20) ?? ''}` !== recipeSignature)];
      }
      console.log('[HomePage] Adding new English recipe to allRecipes.');
      return [recipe, ...prevRecipes];
    });
    setViewingAllRecipes(false);
    setSearchQuery('');
    
    toast({
      title: "Voilà! Recipe Generated!",
      description: (
        <div className="flex items-center">
          <Utensils className="h-5 w-5 mr-2 text-accent" />
          <span>Your recipe for "{recipe.recipeName}" is ready. Now translating to Hindi...</span>
        </div>
      ),
      duration: 4000,
    });

    setIsTranslating(true);
    console.log('[HomePage] Triggering translation for recipe:', recipe.recipeName);
    const translationResult = await handleTranslateRecipeAction(recipe);
    setIsTranslating(false);

    if (translationResult.hindiRecipe) {
      console.log('[HomePage] Hindi translation received. Recipe Name (HI):', translationResult.hindiRecipe.recipeName);
      setCurrentHindiRecipe(translationResult.hindiRecipe);
       toast({
        title: "अनुवाद सफल!",
        description: (
          <div className="flex items-center">
            <Languages className="h-5 w-5 mr-2 text-accent" />
            <span>"{recipe.recipeName}" का हिंदी अनुवाद तैयार है।</span> 
          </div>
        ),
        duration: 5000,
      });
    } else if (translationResult.error) {
      console.error('[HomePage] Translation error:', translationResult.error);
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description: `Could not translate "${recipe.recipeName}" to Hindi. ${translationResult.error}`,
        duration: 7000,
      });
    }
  }, [setCurrentEnglishRecipe, setAllRecipes, toast, setCurrentHindiRecipe, setIsTranslating, setCurrentLanguage, setViewingAllRecipes, setSearchQuery]);

  const handleGenerationError = useCallback((message: string) => {
    console.error('[HomePage] handleGenerationError called with message:', message);
    toast({
      variant: "destructive",
      title: "Oops! Something went wrong.",
      description: message || "Failed to generate recipe. Please try again.",
      duration: 8000,
    });
  }, [toast]);

  const toggleLanguage = () => {
    setCurrentLanguage(prevLang => prevLang === 'en' ? 'hi' : 'en');
  };

  const recipeForDisplay = useMemo(() => {
    if (currentLanguage === 'hi' && currentHindiRecipe) {
      return { 
        recipeName: currentHindiRecipe.recipeName,
        ingredients: currentHindiRecipe.ingredients,
        instructions: currentHindiRecipe.instructions,
      } as GenerateRecipeOutput; // Cast to fit RecipeCard's expectation
    }
    return currentEnglishRecipe;
  }, [currentLanguage, currentEnglishRecipe, currentHindiRecipe]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return allRecipes;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allRecipes.filter(recipe =>
      recipe.recipeName.toLowerCase().includes(lowerCaseQuery) ||
      (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [allRecipes, searchQuery]);

  const recipesToDisplayInList = searchQuery ? filteredRecipes : allRecipes;

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

        {recipeForDisplay && !viewingAllRecipes && (
          <section id="current-recipe" aria-labelledby="current-recipe-heading" className="mb-12 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 id="current-recipe-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
                {currentLanguage === 'en' ? 'Your Latest Creation' : 'आपकी नवीनतम रचना'}
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {currentEnglishRecipe && currentHindiRecipe && (
                  <Button variant="outline" onClick={toggleLanguage} className="w-full sm:w-auto" disabled={isTranslating && !currentHindiRecipe}>
                    {isTranslating && !currentHindiRecipe ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Languages className="mr-2 h-4 w-4" />
                    )}
                    {isTranslating && !currentHindiRecipe
                      ? (currentLanguage === 'en' ? 'Translating...' : 'अनुवाद हो रहा है...')
                      : (currentLanguage === 'en' ? 'हिंदी में देखें' : 'View in English')}
                  </Button>
                )}
                 {allRecipes.length > 0 && (
                  <Button variant="outline" onClick={() => { setViewingAllRecipes(true); setSearchQuery(''); }} className="w-full sm:w-auto">
                    <History className="mr-2 h-4 w-4" />
                    {currentLanguage === 'en' ? 'View Recipe History' : 'रेसिपी इतिहास देखें'}
                  </Button>
                )}
              </div>
            </div>
            <RecipeCard recipe={recipeForDisplay} />
             {isTranslating && !currentHindiRecipe && currentEnglishRecipe && (
                <div className="mt-4 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>{'Translating to Hindi...'}</span>
                </div>
              )}
          </section>
        )}
        
        {(viewingAllRecipes || (!recipeForDisplay && allRecipes.length > 0)) && (
          <>
            <Separator className="my-12 bg-border/50" />
            <section id="recipe-collection" aria-labelledby="recipe-collection-heading" className="animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
                <h2 id="recipe-collection-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Recipe History' : 'रेसिपी इतिहास'}
                </h2>
                {recipeForDisplay && viewingAllRecipes && (
                   <Button variant="outline" onClick={() => setViewingAllRecipes(false)} className="w-full sm:w-auto">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      {currentLanguage === 'en' ? 'View Latest Recipe' : 'नवीनतम रेसिपी देखें'}
                    </Button>
                )}
              </div>
              <RecipeSearch onSearch={setSearchQuery} />
              <RecipeList
                recipes={recipesToDisplayInList} 
                emptyStateMessage={searchQuery 
                  ? (currentLanguage === 'en' ? "No recipes match your search." : "आपकी खोज से कोई रेसिपी मेल नहीं खाती।")
                  : (currentLanguage === 'en' ? "Your recipe history is empty. Generate some recipes!" : "आपका रेसिपी इतिहास खाली है। कुछ रेसिपी बनाएं!")}
              />
            </section>
          </>
        )}

        {!recipeForDisplay && allRecipes.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-xl shadow-sm p-8 mt-8 border border-border/30">
            <BookOpen className="mx-auto h-20 w-20 mb-6 text-primary/60" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              {currentLanguage === 'en' ? 'Welcome to Jhatpat Recipes!' : 'झटपट रेसिपीज़ में आपका स्वागत है!'}
            </h2>
            <p className="text-lg mb-1">
              {currentLanguage === 'en' ? 'Ready to discover delicious Indian meals?' : 'स्वादिष्ट भारतीय भोजन खोजने के लिए तैयार हैं?'}
            </p>
            <p>
              {currentLanguage === 'en' ? 'Enter your ingredients above and let the magic happen.' : 'ऊपर अपनी सामग्री दर्ज करें और जादू देखें।'}
            </p>
          </div>
        )}
      </main>
      <footer className="py-6 border-t border-border/30 text-center text-muted-foreground text-sm bg-card mt-auto">
          <p>&copy; {new Date().getFullYear()} {currentLanguage === 'en' ? 'Jhatpat Recipes. Happy Cooking!' : 'झटपट रेसिपीज़। हैप्पी कुकिंग!'}</p>
      </footer>
    </div>
  );
}
