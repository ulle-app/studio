
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
  ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

const isStapleTool = ai.defineTool(
  {
    name: 'isStaple',
    description: 'Checks if an ingredient is a common kitchen staple and should not be included in the recipe ingredients list.',
    inputSchema: z.object({
      ingredient: z.string().describe('The ingredient to check.'),
    }),
    outputSchema: z.boolean(),
  },
  async (input) => {
    const stapleIngredients = ['salt', 'pepper', 'water', 'oil', 'sugar'];
    return stapleIngredients.includes(input.ingredient.toLowerCase());
  }
);

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  tools: [isStapleTool],
  prompt: `You are a recipe generator. You will generate a recipe based on the ingredients provided.

  Ingredients: {{{ingredients}}}

  Use the isStaple tool to check if an ingredient is a common staple. If it is a staple, do not include it in the ingredients list.
  The output should be a valid JSON object.
  `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
