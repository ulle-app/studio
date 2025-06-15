
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
  
  const validatedFields = ingredientsSchema.safeParse({
    ingredients: rawIngredients,
  });

  if (!validatedFields.success) {
    return {
      inputError: validatedFields.error.flatten().fieldErrors.ingredients?.[0] ?? "Invalid input.",
    };
  }

  const ingredients = validatedFields.data.ingredients;

  try {
    // The generateRecipe flow (and its Zod output schema) is responsible for ensuring
    // the output structure is correct. If not, it should throw an error.
    const recipeOutput = await generateRecipe({ ingredients } as GenerateRecipeInput);
    
    // Defensive check, though Genkit's Zod validation + output! in flow should handle this.
    if (!recipeOutput || typeof recipeOutput.recipeName !== 'string' || typeof recipeOutput.instructions !== 'string') {
        console.error("AI returned incomplete or malformed recipe structure:", recipeOutput);
        return { error: "Failed to generate a complete recipe. The AI returned an unexpected or incomplete structure. Please try again." };
    }
    
    // Ensure ingredients is an array, default to empty if missing or not an array.
    // Zod schema z.array(z.string()) should ensure it's an array (possibly empty).
    const finalRecipeOutput: GenerateRecipeOutput = {
        ...recipeOutput,
        ingredients: Array.isArray(recipeOutput.ingredients) ? recipeOutput.ingredients : [],
    };
    
    return { recipe: finalRecipeOutput };
  } catch (e: unknown) {
    console.error("Error in handleGenerateRecipeAction (full error object):", e);
    let errorMessage = "An unexpected error occurred while generating the recipe. This could be due to network issues or an internal AI service problem. Please try again later.";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
      errorMessage = e.message;
    } else {
      // Attempt to get a more detailed error string if it's some other object.
      try {
        errorMessage = `Genkit flow error: ${JSON.stringify(e)}`;
      } catch {
        // Fallback if stringify fails
        errorMessage = "An unknown error occurred in the recipe generation flow.";
      }
    }
    return { error: errorMessage };
  }
}

