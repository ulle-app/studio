
// @ts-nocheck
// TODO: Fix this file
'use server';

import { generateRecipe, type GenerateRecipeInput, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { z } from 'zod';

const ingredientsSchema = z.object({
  ingredients: z.string().min(3, "Please enter at least 3 characters for ingredients.").max(500, "Ingredients list is too long, please keep it under 500 characters."),
});

export async function handleGenerateRecipeAction(
  prevState: any,
  formData: FormData
): Promise<{ recipe?: GenerateRecipeOutput; error?: string; inputError?: string }> {
  const rawIngredients = formData.get('ingredients');
  console.log('[Action] Received raw ingredients from form:', rawIngredients);
  
  const validatedFields = ingredientsSchema.safeParse({
    ingredients: rawIngredients,
  });

  if (!validatedFields.success) {
    const inputError = validatedFields.error.flatten().fieldErrors.ingredients?.[0] ?? "Invalid input.";
    console.error('[Action] Input validation failed:', inputError);
    return {
      inputError: inputError,
    };
  }

  const ingredients = validatedFields.data.ingredients;
  console.log('[Action] Validated ingredients, calling generateRecipe flow with:', ingredients);

  try {
    const recipeOutput = await generateRecipe({ ingredients } as GenerateRecipeInput);
    console.log('[Action] Received output from generateRecipe flow:', recipeOutput);
    
    if (!recipeOutput || typeof recipeOutput.recipeName !== 'string' || typeof recipeOutput.instructions !== 'string') {
        console.error("[Action] AI returned incomplete or malformed recipe structure:", recipeOutput);
        return { error: "Failed to generate a complete recipe. The AI returned an unexpected or incomplete structure. Please try again." };
    }
    
    const finalRecipeOutput: GenerateRecipeOutput = {
        ...recipeOutput,
        ingredients: Array.isArray(recipeOutput.ingredients) ? recipeOutput.ingredients : [],
    };
    
    console.log('[Action] Successfully processed recipe:', finalRecipeOutput.recipeName);
    return { recipe: finalRecipeOutput };
  } catch (e: unknown) {
    console.error("[Action] Error during recipe generation (full error object):", e);
    let errorMessage = "An unexpected error occurred while generating the recipe. This could be due to network issues or an internal AI service problem. Please try again later.";
    if (e instanceof Error) {
      errorMessage = e.message;
      console.error("[Action] Error message:", e.message);
      if (e.stack) {
        console.error("[Action] Error stack:", e.stack);
      }
    } else if (typeof e === 'string') {
      errorMessage = e;
      console.error("[Action] Error (string):", e);
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
      errorMessage = e.message;
       console.error("[Action] Error (object with message):", e.message);
    } else {
      try {
        const errorString = JSON.stringify(e);
        errorMessage = `Genkit flow error: ${errorString}`;
        console.error("[Action] Error (non-standard, stringified):", errorString);
      } catch (stringifyError) {
        console.error("[Action] Error stringifying non-standard error:", stringifyError);
        errorMessage = "An unknown error occurred in the recipe generation flow, and the error itself could not be stringified.";
      }
    }
    return { error: errorMessage };
  }
}
