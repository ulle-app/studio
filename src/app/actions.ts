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
    const recipeOutput = await generateRecipe({ ingredients } as GenerateRecipeInput);
    
    if (!recipeOutput || !recipeOutput.recipeName || !recipeOutput.instructions) {
        console.error("AI returned incomplete recipe:", recipeOutput);
        return { error: "Failed to generate a complete recipe. The AI returned an unexpected response. Please try again with different ingredients or be more specific." };
    }
    // Ensure ingredients is an array, default to empty if missing
    if (recipeOutput.ingredients === undefined) {
      recipeOutput.ingredients = [];
    }
    
    return { recipe: recipeOutput as GenerateRecipeOutput };
  } catch (e: unknown) {
    console.error("Error in handleGenerateRecipeAction:", e);
    let errorMessage = "An unexpected error occurred while generating the recipe. This could be due to network issues or an internal AI service problem. Please try again later.";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    return { error: errorMessage };
  }
}
