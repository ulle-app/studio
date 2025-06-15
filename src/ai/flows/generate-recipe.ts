
'use server';

/**
 * @fileOverview Generates a recipe based on a list of ingredients.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients available for use in the recipe.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe.'),
  ingredients: z.array(z.string()).describe('The list of non-staple ingredients required for the recipe. Common kitchen staples (e.g., salt, pepper, oil, sugar, flour, common spices) should generally be excluded. This can be an empty array if all ingredients are staples or no specific ingredients are needed beyond staples.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;


export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  console.log('[Flow:generateRecipe] Exported function called with input:', input);
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a creative recipe generator.
Based on the ingredients provided by the user: {{{ingredients}}}

Your task is to generate a complete recipe. You MUST provide:
1.  A concise and appealing \`recipeName\`.
2.  A list of \`ingredients\` required for the recipe. This list should include any non-staple ingredients derived from the user's input and any other non-staple items you deem necessary for the recipe.
    Common kitchen staples (such as salt, pepper, water, oil, sugar, flour, butter, eggs, milk, common spices like garlic powder or onion powder) should be assumed to be available and therefore EXCLUDED from this \`ingredients\` list, unless a specific, unusual quantity of a staple is crucial for the recipe. Focus on listing ingredients the user might need to specifically check if they have or purchase.
3.  Clear, step-by-step \`instructions\` for preparing the recipe.

Ensure all fields in the output schema (\`recipeName\`, \`ingredients\`, \`instructions\`) are populated. The \`ingredients\` list can be empty if all provided ingredients are determined to be staples and no other non-staple ingredients are needed.
  `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async (input: GenerateRecipeInput) => {
    console.log('[Flow:generateRecipeFlow] Flow started with input:', input);
    try {
      const {output, history} = await prompt(input);
      console.log('[Flow:generateRecipeFlow] Prompt output received:', output);
      if (history) {
        console.log('[Flow:generateRecipeFlow] Prompt history:', JSON.stringify(history, null, 2));
      }
      if (!output) {
        console.error('[Flow:generateRecipeFlow] Prompt returned null or undefined output.');
        throw new Error('AI prompt returned no output.');
      }
      // Ensure ingredients is always an array, even if AI fails to provide it correctly (though Zod schema should handle this)
      const finalOutput: GenerateRecipeOutput = {
        ...output,
        ingredients: Array.isArray(output.ingredients) ? output.ingredients : [],
      };
      return finalOutput;
    } catch (error) {
      console.error('[Flow:generateRecipeFlow] Error during prompt execution:', error);
      throw error; 
    }
  }
);
