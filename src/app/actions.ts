
// @ts-nocheck
// TODO: Fix this file
'use server';

import { generateRecipe, type GenerateRecipeInput, type MultipleRecipesOutput, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { translateRecipeToHindi, type TranslateRecipeInput, type TranslateRecipeOutput } from '@/ai/flows/translate-recipe';
import { generateRecipeImage, type GenerateRecipeImageInput, type GenerateRecipeImageOutput } from '@/ai/flows/generate-recipe-image';
import { z } from 'zod';

const ingredientsSchema = z.object({
  ingredients: z.string().min(3, "Please enter at least 3 characters for ingredients.").max(500, "Ingredients list is too long, please keep it under 500 characters."),
});

export async function handleGenerateRecipeAction(
  prevState: any,
  formData: FormData
): Promise<{ recipes?: GenerateRecipeOutput[]; error?: string; inputError?: string }> {
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
    // The generateRecipe flow now returns MultipleRecipesOutput
    const multipleRecipesOutput: MultipleRecipesOutput = await generateRecipe({ ingredients } as GenerateRecipeInput);
    console.log('[Action:Generate] Received output from generateRecipe flow:', multipleRecipesOutput);
    
    if (!multipleRecipesOutput || !Array.isArray(multipleRecipesOutput.generatedRecipes) || multipleRecipesOutput.generatedRecipes.length === 0) {
        console.error("[Action:Generate] AI returned incomplete or malformed recipe list structure:", multipleRecipesOutput);
        return { error: "Failed to generate recipes. The AI returned an unexpected or incomplete structure. Please try again." };
    }
    
    // Ensure each recipe in the list is well-formed
    const validatedRecipes = multipleRecipesOutput.generatedRecipes.map(recipe => {
        if (typeof recipe.recipeName !== 'string' || typeof recipe.instructions !== 'string') {
            console.error("[Action:Generate] An individual recipe in the list is malformed:", recipe);
            // Optionally, filter out malformed recipes or throw a more specific error
            // For now, we'll rely on the flow's schema validation primarily
        }
        return {
            ...recipe,
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        };
    });
    
    console.log('[Action:Generate] Successfully processed recipes. Count:', validatedRecipes.length);
    return { recipes: validatedRecipes }; // Return the array of recipes
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
  englishRecipe: GenerateRecipeOutput // This action still handles one recipe at a time
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


export async function handleGenerateImageAction(
  recipeName: string // This action still handles one recipe name at a time
): Promise<{ imageDataUri?: string; error?: string }> {
  console.log('[Action:GenerateImage] Received recipe name for image generation:', recipeName);

  if (!recipeName) {
    console.error('[Action:GenerateImage] Invalid recipe name data received.');
    return { error: "Invalid recipe name provided for image generation." };
  }

  const input: GenerateRecipeImageInput = { recipeName };

  try {
    const imageOutput = await generateRecipeImage(input);
    console.log('[Action:GenerateImage] Received image data URI from flow.');

    if (!imageOutput || !imageOutput.imageDataUri) {
        console.error("[Action:GenerateImage] AI returned no image data URI:", imageOutput);
        return { error: "Failed to generate the recipe image. The AI returned no image data." };
    }
    return { imageDataUri: imageOutput.imageDataUri };
  } catch (e: unknown) {
    console.error("[Action:GenerateImage] Error during recipe image generation (full error object):", e);
    let errorMessage = "An unexpected error occurred while generating the recipe image.";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
      errorMessage = e.message;
    }
    console.error("[Action:GenerateImage] Error message:", errorMessage);
    return { error: errorMessage };
  }
}

