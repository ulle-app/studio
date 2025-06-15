'use server';

/**
 * @fileOverview A recipe modification AI agent.
 *
 * - improveRecipe - A function that handles the recipe modification process.
 * - ImproveRecipeInput - The input type for the improveRecipe function.
 * - ImproveRecipeOutput - The return type for the improveRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveRecipeInputSchema = z.object({
  recipe: z.string().describe('The recipe to be improved.'),
  modificationRequest: z
    .string()
    .describe('The modification to be made to the recipe.'),
});
export type ImproveRecipeInput = z.infer<typeof ImproveRecipeInputSchema>;

const ImproveRecipeOutputSchema = z.object({
  improvedRecipe: z.string().describe('The improved recipe.'),
});
export type ImproveRecipeOutput = z.infer<typeof ImproveRecipeOutputSchema>;

export async function improveRecipe(input: ImproveRecipeInput): Promise<ImproveRecipeOutput> {
  return improveRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveRecipePrompt',
  input: {schema: ImproveRecipeInputSchema},
  output: {schema: ImproveRecipeOutputSchema},
  prompt: `You are an expert chef specializing in modifying recipes.

You will use this information to modify the recipe according to the user's request.

Recipe: {{{recipe}}}
Modification Request: {{{modificationRequest}}}`,
});

const improveRecipeFlow = ai.defineFlow(
  {
    name: 'improveRecipeFlow',
    inputSchema: ImproveRecipeInputSchema,
    outputSchema: ImproveRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
