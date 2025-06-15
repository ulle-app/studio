
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
  ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe. This can be an empty array if all ingredients are staples or no specific ingredients are needed beyond staples.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

const isStapleTool = ai.defineTool(
  {
    name: 'isStaple',
    description: 'Checks if an ingredient is a common kitchen staple (like salt, pepper, water, oil, sugar, flour, butter, eggs, milk). Call this for each ingredient provided by the user.',
    inputSchema: z.object({
      ingredient: z.string().describe('The ingredient to check.'),
    }),
    outputSchema: z.boolean(),
  },
  async (input) => {
    console.log('[isStapleTool] Checking ingredient:', input.ingredient);
    const stapleIngredients = ['salt', 'pepper', 'water', 'oil', 'sugar', 'flour', 'butter', 'eggs', 'milk']; // Expanded list
    const result = stapleIngredients.includes(input.ingredient.toLowerCase().trim());
    console.log('[isStapleTool] Is staple?', result);
    return result;
  }
);

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  console.log('[Flow:generateRecipe] Exported function called with input:', input);
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  tools: [isStapleTool],
  prompt: `You are a creative recipe generator.
Based on the ingredients provided by the user: {{{ingredients}}}

Your task is to generate a complete recipe. You MUST provide:
1.  A concise and appealing \`recipeName\`.
2.  A list of \`ingredients\` required for the recipe. For each ingredient the user provided, you MUST use the \`isStaple\` tool to determine if it's a common kitchen staple.
    - If \`isStaple\` returns \`true\` for an ingredient, EXCLUDE it from the final \`ingredients\` list in your output.
    - If \`isStaple\` returns \`false\`, INCLUDE it in the final \`ingredients\` list.
    The final ingredients list may also include other non-staple items you deem necessary for the recipe that were not in the user's original list.
3.  Clear, step-by-step \`instructions\` for preparing the recipe.

Ensure all fields in the output schema (\`recipeName\`, \`ingredients\`, \`instructions\`) are populated. The \`ingredients\` list can be empty if all provided ingredients are staples and no others are needed.
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
      return output;
    } catch (error) {
      console.error('[Flow:generateRecipeFlow] Error during prompt execution:', error);
      throw error; // Re-throw the error to be caught by the server action
    }
  }
);
