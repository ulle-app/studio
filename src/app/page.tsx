
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { handleGenerateRecipeAction, handleTranslateRecipeAction, handleGenerateImageAction } from './actions';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { TranslateRecipeOutput } from '@/ai/flows/translate-recipe';
import useLocalStorage from '@/hooks/use-local-storage';
import { useToast } from "@/hooks/use-toast";
import { ChefHat, BookOpen, History, EyeIcon, Utensils, Languages, Loader2, Image as ImageIcon, ListOrdered, CheckCircle, AlertCircle, ThumbsUp } from 'lucide-react';

export default function HomePage() {
  const [latestGeneratedRecipes, setLatestGeneratedRecipes] = useState<GenerateRecipeOutput[] | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [activeRecipeHindi, setActiveRecipeHindi] = useState<TranslateRecipeOutput | null>(null);
  
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hi'>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const initialRecipes = useMemo(() => [], []); // Stable reference for useLocalStorage
  const [allRecipes, setAllRecipes] = useLocalStorage<GenerateRecipeOutput[]>('jhatpatRecipes', initialRecipes);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingAllRecipes, setViewingAllRecipes] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  const { toast } = useToast();

  const handleRecipeGenerated = useCallback(async (recipes: GenerateRecipeOutput[]) => {
    console.log('[HomePage] handleRecipeGenerated called with recipes count:', recipes.length);
    setLatestGeneratedRecipes(recipes);
    setActiveRecipe(null); // Clear previously active recipe
    setActiveRecipeHindi(null);
    setCurrentLanguage('en');
    setViewingAllRecipes(false);
    setSearchQuery('');

    toast({
      title: "Voilà! Recipes Generated!",
      description: (
        <div className="flex items-center">
          <ThumbsUp className="h-5 w-5 mr-2 text-accent" />
          <span>We found {recipes.length} recipe(s) for you! Select one to see details.</span>
        </div>
      ),
      duration: 5000,
    });

    // Add all newly generated recipes to the history
    // Ensure no direct duplicates are added to history based on name and first 20 chars of instructions
    setAllRecipes(prevHistory => {
      const newHistory = [...prevHistory];
      recipes.forEach(newRecipe => {
        const recipeSignature = `${newRecipe.recipeName}-${newRecipe.instructions?.substring(0, 20) ?? ''}`;
        const existingIndex = newHistory.findIndex(r => `${r.recipeName}-${r.instructions?.substring(0,20) ?? ''}` === recipeSignature);
        if (existingIndex === -1) {
          newHistory.unshift(newRecipe); // Add to the beginning
        } else {
          // Optionally update existing if needed, or just skip
          console.log('[HomePage] Recipe already in history, not re-adding:', newRecipe.recipeName);
        }
      });
      return newHistory;
    });

  }, [setAllRecipes, toast]);


  const handleSelectRecipe = useCallback(async (recipe: GenerateRecipeOutput) => {
    console.log('[HomePage] handleSelectRecipe called for:', recipe.recipeName);
    setActiveRecipe(recipe);
    setActiveRecipeHindi(null);
    setCurrentLanguage('en');
    setViewingAllRecipes(false); // Ensure we are not in history view when a new recipe is selected

    toast({
      title: "Recipe Selected!",
      description: (
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
          <span>Viewing "{recipe.recipeName}". Fetching image & translation...</span>
        </div>
      ),
      duration: 3000,
    });
    
    // Stage 1: Generate Image
    if (!recipe.imageDataUri) { // Only generate if not already present (e.g. from history)
      setIsGeneratingImage(true);
      console.log('[HomePage] Triggering image generation for selected recipe:', recipe.recipeName);
      const imageResult = await handleGenerateImageAction(recipe.recipeName);
      setIsGeneratingImage(false);

      if (imageResult.imageDataUri) {
        console.log('[HomePage] Image generated successfully for', recipe.recipeName);
        const updatedRecipeWithImage = { ...recipe, imageDataUri: imageResult.imageDataUri };
        setActiveRecipe(updatedRecipeWithImage); // Update active recipe with image
        
        // Update this recipe in latestGeneratedRecipes list if it's from there
        setLatestGeneratedRecipes(prevList => 
            prevList?.map(r => r.recipeName === updatedRecipeWithImage.recipeName && r.instructions === updatedRecipeWithImage.instructions ? updatedRecipeWithImage : r) || null
        );
        // Update this recipe in allRecipes (history)
        setAllRecipes(prevHistory => 
            prevHistory.map(r => r.recipeName === updatedRecipeWithImage.recipeName && r.instructions === updatedRecipeWithImage.instructions ? updatedRecipeWithImage : r)
        );
        toast({
          title: "Image Ready!",
          description: (
            <div className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-accent" />
              <span>An image for "{recipe.recipeName}" has been generated.</span>
            </div>
          ),
          duration: 5000,
        });
      } else if (imageResult.error) {
        console.error('[HomePage] Image generation error for selected recipe:', imageResult.error);
        toast({
          variant: "destructive",
          title: "Image Generation Failed",
          description: `Could not generate an image for "${recipe.recipeName}". ${imageResult.error}`,
        });
      }
    } else {
       console.log('[HomePage] Image already exists for selected recipe:', recipe.recipeName);
    }

    // Stage 2: Translate
    setIsTranslating(true);
    console.log('[HomePage] Triggering translation for selected recipe:', recipe.recipeName);
    const translationResult = await handleTranslateRecipeAction(recipe); // Pass the potentially image-updated recipe
    setIsTranslating(false);

    if (translationResult.hindiRecipe) {
      console.log('[HomePage] Hindi translation received for selected recipe. Name (HI):', translationResult.hindiRecipe.recipeName);
      setActiveRecipeHindi(translationResult.hindiRecipe);
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
      console.error('[HomePage] Translation error for selected recipe:', translationResult.error);
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description: `Could not translate "${recipe.recipeName}" to Hindi. ${translationResult.error}.`,
      });
    }
  }, [setAllRecipes, toast, setActiveRecipe, setActiveRecipeHindi, setCurrentLanguage, setIsGeneratingImage, setIsTranslating, setLatestGeneratedRecipes]);


  const handleGenerationError = useCallback((message: string) => {
    console.error('[HomePage] handleGenerationError called with message:', message);
    setIsGeneratingImage(false); 
    setIsTranslating(false);
    toast({
      variant: "destructive",
      title: "Oops! Recipe Generation Failed.",
      description: message || "Failed to generate recipes. Please try again.",
      duration: 8000,
    });
  }, [toast]);

  const toggleLanguage = () => {
    setCurrentLanguage(prevLang => prevLang === 'en' ? 'hi' : 'en');
  };

  const activeRecipeForDisplay = useMemo(() => {
    if (!activeRecipe) return null;
    if (currentLanguage === 'hi' && activeRecipeHindi) {
      return { 
        ...activeRecipe, // Retain original image URI and other non-text fields
        recipeName: activeRecipeHindi.recipeName,
        ingredients: activeRecipeHindi.ingredients,
        instructions: activeRecipeHindi.instructions,
      } as GenerateRecipeOutput;
    }
    return activeRecipe;
  }, [currentLanguage, activeRecipe, activeRecipeHindi]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return allRecipes;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allRecipes.filter(recipe =>
      recipe.recipeName.toLowerCase().includes(lowerCaseQuery) ||
      (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [allRecipes, searchQuery]);
  
  const viewRecipeFromHistory = useCallback(async (recipe: GenerateRecipeOutput) => {
    console.log('[HomePage] Viewing recipe from history:', recipe.recipeName);
    // This function will now essentially behave like selecting a recipe
    setLatestGeneratedRecipes(null); // Clear any list of freshly generated recipes
    await handleSelectRecipe(recipe); // This will set activeRecipe and trigger image/translation
  }, [handleSelectRecipe]);


  const recipesToDisplayInList = searchQuery ? filteredRecipes : allRecipes;

  if (!clientLoaded) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <AppHeader />
        <main className="container mx-auto px-4 pb-16 flex-grow flex items-center justify-center">
          <ChefHat className="h-24 w-24 animate-pulse text-primary/50" />
        </main>
      </div>
    );
  }

  const showRecipeListHeader = currentLanguage === 'en' ? "We found these recipes for you:" : "हमें आपके लिए ये रेसिपी मिलीं:";
  const showRecipeListSubHeader = currentLanguage === 'en' ? "Select one to see the full details, image, and translation." : "पूर्ण विवरण, चित्र और अनुवाद देखने के लिए एक चुनें।";


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

        {latestGeneratedRecipes && !activeRecipe && !viewingAllRecipes && (
          <section id="generated-recipe-list" aria-labelledby="generated-list-heading" className="mb-12 animate-in fade-in duration-500">
            <h2 id="generated-list-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary mb-2">
              {showRecipeListHeader}
            </h2>
            <p className="text-muted-foreground mb-6">{showRecipeListSubHeader}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestGeneratedRecipes.map((recipe, index) => (
                <Card 
                    key={`${recipe.recipeName}-${index}`} 
                    className="hover:shadow-primary/20 hover:border-primary/50 transition-all duration-200 cursor-pointer border"
                    onClick={() => handleSelectRecipe(recipe)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectRecipe(recipe)}
                >
                  <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center">
                        <Utensils className="mr-3 h-5 w-5 flex-shrink-0" /> 
                        {recipe.recipeName}
                    </CardTitle>
                  </CardHeader>
                  {/* Optionally, show a snippet of ingredients or instructions here */}
                   <CardContent>
                     <p className="text-sm text-muted-foreground line-clamp-3">
                       {recipe.instructions?.split('\n')[0] || 'View details...'}
                     </p>
                   </CardContent>
                </Card>
              ))}
            </div>
             {allRecipes.length > 0 && (
                <div className="mt-8 text-center">
                    <Button variant="outline" onClick={() => { setViewingAllRecipes(true); setSearchQuery(''); setLatestGeneratedRecipes(null); setActiveRecipe(null);}} className="w-full sm:w-auto">
                        <History className="mr-2 h-4 w-4" />
                        {currentLanguage === 'en' ? 'Or, View Full Recipe History' : 'या, संपूर्ण रेसिपी इतिहास देखें'}
                    </Button>
                </div>
            )}
          </section>
        )}
        
        {activeRecipeForDisplay && !viewingAllRecipes && (
          <section id="current-recipe" aria-labelledby="current-recipe-heading" className="mb-12 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 id="current-recipe-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
                {currentLanguage === 'en' ? 'Selected Recipe' : 'चयनित रेसिपी'}
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 {latestGeneratedRecipes && (
                    <Button variant="ghost" onClick={() => {setActiveRecipe(null); setActiveRecipeHindi(null);}} className="w-full sm:w-auto">
                        <ListOrdered className="mr-2 h-4 w-4" />
                        {currentLanguage === 'en' ? 'Back to Recipe List' : 'रेसिपी सूची पर वापस जाएं'}
                    </Button>
                 )}
                {activeRecipe && activeRecipeHindi && (
                  <Button variant="outline" onClick={toggleLanguage} className="w-full sm:w-auto" disabled={isTranslating && !activeRecipeHindi}>
                    {isTranslating && !activeRecipeHindi && currentLanguage === 'en' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Languages className="mr-2 h-4 w-4" />
                    )}
                    {isTranslating && !activeRecipeHindi && currentLanguage === 'en'
                      ? 'Translating...'
                      : (currentLanguage === 'en' ? 'हिंदी में देखें' : 'View in English')}
                  </Button>
                )}
                 {allRecipes.length > 0 && (
                  <Button variant="outline" onClick={() => { setViewingAllRecipes(true); setSearchQuery(''); setLatestGeneratedRecipes(null); setActiveRecipe(null);}} className="w-full sm:w-auto">
                    <History className="mr-2 h-4 w-4" />
                    {currentLanguage === 'en' ? 'View Recipe History' : 'रेसिपी इतिहास देखें'}
                  </Button>
                )}
              </div>
            </div>
            <RecipeCard 
              recipe={activeRecipeForDisplay}
              isGeneratingImage={isGeneratingImage && !activeRecipeForDisplay.imageDataUri}
            />
             {(isTranslating && !activeRecipeHindi && activeRecipe && currentLanguage === 'en') && (
                <div className="mt-4 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>{'Translating to Hindi...'}</span>
                </div>
              )}
          </section>
        )}
        
        {(viewingAllRecipes || (!latestGeneratedRecipes && !activeRecipe && allRecipes.length > 0)) && (
          <>
            <Separator className="my-12 bg-border/50" />
            <section id="recipe-collection" aria-labelledby="recipe-collection-heading" className="animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
                <h2 id="recipe-collection-heading" className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Recipe History' : 'रेसिपी इतिहास'}
                </h2>
                {(latestGeneratedRecipes || activeRecipe) && viewingAllRecipes && (
                   <Button variant="outline" onClick={() => { setViewingAllRecipes(false); if (!latestGeneratedRecipes && activeRecipe) { setLatestGeneratedRecipes([activeRecipe]) /* or some logic to go back to list if it existed */} else if (!latestGeneratedRecipes && !activeRecipe) { /* stay in history or clear active if any */ }  }} className="w-full sm:w-auto">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      {currentLanguage === 'en' ? 'Back to Current/Generated' : 'वर्तमान/उत्पन्न पर वापस जाएं'}
                    </Button>
                )}
              </div>
              <RecipeSearch onSearch={setSearchQuery} />
              <RecipeList
                recipes={recipesToDisplayInList} 
                emptyStateMessage={searchQuery 
                  ? (currentLanguage === 'en' ? "No recipes match your search." : "आपकी खोज से कोई रेसिपी मेल नहीं खाती।")
                  : (currentLanguage === 'en' ? "Your recipe history is empty. Generate some recipes!" : "आपका रेसिपी इतिहास खाली है। कुछ रेसिपी बनाएं!")}
                onViewRecipe={viewRecipeFromHistory}
              />
            </section>
          </>
        )}

        {!latestGeneratedRecipes && !activeRecipe && allRecipes.length === 0 && !viewingAllRecipes && (
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

