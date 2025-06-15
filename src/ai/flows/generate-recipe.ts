
'use server';

/**
 * @fileOverview Generates multiple Indian recipes based on a list of ingredients.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - MultipleRecipesOutput - The return type for the generateRecipe function, containing a list of recipes.
 * - GenerateRecipeOutput - The type for a single recipe object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients available for use in the recipe.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Schema for a single recipe
const SingleRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated Indian recipe.'),
  ingredients: z.array(z.string()).describe('The list of non-staple ingredients required for the Indian recipe. Common kitchen staples (e.g., salt, pepper, oil, sugar, flour, common Indian spices like turmeric, cumin, coriander powder) should generally be excluded. This can be an empty array if all ingredients are staples or no specific ingredients are needed beyond staples.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the Indian recipe.'),
  imageDataUri: z.string().optional().describe("The data URI of an image for the recipe, if generated. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateRecipeOutput = z.infer<typeof SingleRecipeOutputSchema>;

// Schema for the AI's output, containing a list of recipes
const MultipleRecipesOutputSchema = z.object({
  generatedRecipes: z.array(SingleRecipeOutputSchema).min(1).max(3).describe('A list of 2 to 3 generated Indian recipes based on the provided ingredients. Each recipe should be distinct.'),
});
export type MultipleRecipesOutput = z.infer<typeof MultipleRecipesOutputSchema>;


export async function generateRecipe(input: GenerateRecipeInput): Promise<MultipleRecipesOutput> {
  console.log('[Flow:generateRecipe] Exported function called with input:', input);
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMultipleRecipesPrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: MultipleRecipesOutputSchema},
  prompt: `You are a creative recipe generator specializing in Indian cuisine.
Based on the ingredients provided by the user: {{{ingredients}}}

Your task is to generate 2 to 3 complete, simple but distinct Indian recipes.
For each recipe, you MUST provide:
1.  A concise and appealing \`recipeName\`.
2.  A list of \`ingredients\` required for the recipe. This list should include any non-staple ingredients derived from the user's input and any other non-staple items you deem necessary for the recipe.
    Common kitchen staples (such as salt, pepper, water, oil, sugar, flour, butter, eggs, milk, common Indian spices like turmeric powder, cumin powder, coriander powder, garam masala, ginger-garlic paste) should be assumed to be available and therefore EXCLUDED from this \`ingredients\` list, unless a specific, unusual quantity of a staple is crucial for the recipe. Focus on listing ingredients the user might need to specifically check if they have or purchase.
3.  Clear, step-by-step \`instructions\` for preparing the recipe.

Ensure the output is an object with a key 'generatedRecipes' which is an array of these recipe objects. Each recipe object in the array must have \`recipeName\`, \`ingredients\`, and \`instructions\` populated. The \`ingredients\` list for a recipe can be empty if all provided ingredients for that recipe are determined to be staples and no other non-staple ingredients are needed.
Do NOT populate the \`imageDataUri\` field for any recipe. It will be handled separately.
  `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: MultipleRecipesOutputSchema, // Output is now an array of recipes
  },
  async (input: GenerateRecipeInput) => {
    console.log('[Flow:generateRecipeFlow] Flow started with input:', input);
    try {
      const {output, history} = await prompt(input);
      console.log('[Flow:generateRecipeFlow] Prompt output received:', output);
      if (history) {
        console.log('[Flow:generateRecipeFlow] Prompt history:', JSON.stringify(history, null, 2));
      }
      if (!output || !Array.isArray(output.generatedRecipes) || output.generatedRecipes.length === 0) {
        console.error('[Flow:generateRecipeFlow] Prompt returned null, undefined, or empty recipes array.');
        throw new Error('AI prompt returned no recipes or an invalid structure.');
      }
      
      // Ensure each recipe has ingredients as an array
      const validatedRecipes = output.generatedRecipes.map(recipe => ({
        ...recipe,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      }));

      return { generatedRecipes: validatedRecipes };

    } catch (error) {
      console.error('[Flow:generateRecipeFlow] Error during prompt execution:', error);
      throw error; 
    }
  }
);

