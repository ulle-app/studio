
// @ts-nocheck
// TODO: Fix this file
'use server';

import { generateRecipe, type GenerateRecipeInput, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { translateRecipeToHindi, type TranslateRecipeInput, type TranslateRecipeOutput } from '@/ai/flows/translate-recipe';
import { z } from 'zod';

const ingredientsSchema = z.object({
  ingredients: z.string().min(3, "Please enter at least 3 characters for ingredients.").max(500, "Ingredients list is too long, please keep it under 500 characters."),
});

export async function handleGenerateRecipeAction(
  prevState: any,
  formData: FormData
): Promise<{ recipe?: GenerateRecipeOutput; error?: string; inputError?: string }> {
  const rawIngredients = formData.get('ingredients');
  console.log('[Action:Generate] Received raw ingredients from form:', rawIngredients);
  
  const validatedFields = ingredientsSchema.safeParse({
    ingredients: rawIngredients,
  });

  if (!validatedFields.success) {
    const inputError = validatedFields.error.flatten().fieldErrors.ingredients?.[0] ?? "Invalid input.";
    console.error('[Action:Generate] Input validation failed:', inputError);
    return {
      inputError: inputError,
    };
  }

  const ingredients = validatedFields.data.ingredients;
  console.log('[Action:Generate] Validated ingredients, calling generateRecipe flow with:', ingredients);

  try {
    const recipeOutput = await generateRecipe({ ingredients } as GenerateRecipeInput);
    console.log('[Action:Generate] Received output from generateRecipe flow:', recipeOutput);
    
    if (!recipeOutput || typeof recipeOutput.recipeName !== 'string' || typeof recipeOutput.instructions !== 'string') {
        console.error("[Action:Generate] AI returned incomplete or malformed recipe structure:", recipeOutput);
        return { error: "Failed to generate a complete recipe. The AI returned an unexpected or incomplete structure. Please try again." };
    }
    
    const finalRecipeOutput: GenerateRecipeOutput = {
        ...recipeOutput,
        ingredients: Array.isArray(recipeOutput.ingredients) ? recipeOutput.ingredients : [],
    };
    
    console.log('[Action:Generate] Successfully processed recipe:', finalRecipeOutput.recipeName);
    return { recipe: finalRecipeOutput };
  } catch (e: unknown) {
    console.error("[Action:Generate] Error during recipe generation (full error object):", e);
    let errorMessage = "An unexpected error occurred while generating the recipe. This could be due to network issues or an internal AI service problem. Please try again later.";
    if (e instanceof Error) {
      errorMessage = e.message;
      console.error("[Action:Generate] Error message:", e.message);
      if (e.stack) {
        console.error("[Action:Generate] Error stack:", e.stack);
      }
    } else if (typeof e === 'string') {
      errorMessage = e;
      console.error("[Action:Generate] Error (string):", e);
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
      errorMessage = e.message;
       console.error("[Action:Generate] Error (object with message):", e.message);
    } else {
      try {
        const errorString = JSON.stringify(e);
        errorMessage = `Genkit flow error: ${errorString}`;
        console.error("[Action:Generate] Error (non-standard, stringified):", errorString);
      } catch (stringifyError) {
        console.error("[Action:Generate] Error stringifying non-standard error:", stringifyError);
        errorMessage = "An unknown error occurred in the recipe generation flow, and the error itself could not be stringified.";
      }
    }
    return { error: errorMessage };
  }
}


export async function handleTranslateRecipeAction(
  englishRecipe: GenerateRecipeOutput
): Promise<{ hindiRecipe?: TranslateRecipeOutput; error?: string }> {
  console.log('[Action:Translate] Received English recipe for translation:', englishRecipe);

  if (!englishRecipe || !englishRecipe.recipeName || !englishRecipe.instructions) {
    console.error('[Action:Translate] Invalid English recipe data received.');
    return { error: "Invalid recipe data provided for translation." };
  }

  const ingredientsToTranslate = Array.isArray(englishRecipe.ingredients) ? englishRecipe.ingredients : [];

  const input: TranslateRecipeInput = {
    recipeName: englishRecipe.recipeName,
    ingredients: ingredientsToTranslate,
    instructions: englishRecipe.instructions,
  };

  try {
    const hindiRecipeOutput = await translateRecipeToHindi(input);
    console.log('[Action:Translate] Received Hindi recipe from flow:', hindiRecipeOutput);

    if (!hindiRecipeOutput || typeof hindiRecipeOutput.recipeName !== 'string' || typeof hindiRecipeOutput.instructions !== 'string' || !Array.isArray(hindiRecipeOutput.ingredients)) {
        console.error("[Action:Translate] AI returned incomplete or malformed Hindi recipe structure:", hindiRecipeOutput);
        return { error: "Failed to translate the recipe completely. The AI returned an unexpected or incomplete structure." };
    }
    
    const finalHindiOutput: TranslateRecipeOutput = {
      ...hindiRecipeOutput,
      ingredients: Array.isArray(hindiRecipeOutput.ingredients) ? hindiRecipeOutput.ingredients : [],
    };

    return { hindiRecipe: finalHindiOutput };
  } catch (e: unknown) {
    console.error("[Action:Translate] Error during recipe translation (full error object):", e);
    let errorMessage = "An unexpected error occurred while translating the recipe.";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
      errorMessage = e.message;
    }
    console.error("[Action:Translate] Error message:", errorMessage);
    return { error: errorMessage };
  }
}
