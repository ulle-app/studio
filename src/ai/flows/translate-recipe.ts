
'use server';
/**
 * @fileOverview Translates a recipe from English to Hindi.
 *
 * - translateRecipeToHindi - A function that handles the recipe translation.
 * - TranslateRecipeInput - The input type for the translation function.
 * - TranslateRecipeOutput - The return type for the translation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateRecipeInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe in English.'),
  ingredients: z.array(z.string()).describe('The list of ingredients in English.'),
  instructions: z.string().describe('The step-by-step instructions in English.'),
});
export type TranslateRecipeInput = z.infer<typeof TranslateRecipeInputSchema>;

const TranslateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe translated into Hindi.'),
  ingredients: z.array(z.string()).describe('The list of ingredients translated into Hindi.'),
  instructions: z.string().describe('The step-by-step instructions translated into Hindi.'),
});
export type TranslateRecipeOutput = z.infer<typeof TranslateRecipeOutputSchema>;

export async function translateRecipeToHindi(input: TranslateRecipeInput): Promise<TranslateRecipeOutput> {
  console.log('[Flow:translateRecipeToHindi] Exported function called with input:', input);
  return translateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateRecipeToHindiPrompt',
  input: {schema: TranslateRecipeInputSchema},
  output: {schema: TranslateRecipeOutputSchema},
  prompt: `You are an expert translator specializing in translating culinary content from English to Hindi.
Translate the following recipe details accurately and naturally into Hindi.

Recipe Name (English): {{{recipeName}}}
Ingredients (English):
{{#each ingredients}}
- {{{this}}}
{{/each}}
Instructions (English):
{{{instructions}}}

Provide the translated recipe details in Hindi, ensuring the meaning and context are preserved.
The output should be structured according to the provided schema with fields for translated recipe name, ingredients, and instructions.
For ingredients, maintain the list format. For instructions, maintain the step-by-step format.
Ensure all output fields are populated with accurate Hindi translations.
`,
});

const translateRecipeFlow = ai.defineFlow(
  {
    name: 'translateRecipeFlow',
    inputSchema: TranslateRecipeInputSchema,
    outputSchema: TranslateRecipeOutputSchema,
  },
  async (input: TranslateRecipeInput) => {
    console.log('[Flow:translateRecipeFlow] Flow started with input:', input);
    try {
      const {output, history} = await prompt(input);
      console.log('[Flow:translateRecipeFlow] Prompt output received:', output);
      if (history) {
        console.log('[Flow:translateRecipeFlow] Prompt history:', JSON.stringify(history, null, 2));
      }
      if (!output) {
        console.error('[Flow:translateRecipeFlow] Prompt returned null or undefined output.');
        throw new Error('AI prompt returned no output for translation.');
      }
      // Ensure ingredients is always an array in the output
      const finalOutput: TranslateRecipeOutput = {
        ...output,
        ingredients: Array.isArray(output.ingredients) ? output.ingredients : [],
      };
      return finalOutput;
    } catch (error) {
      console.error('[Flow:translateRecipeFlow] Error during prompt execution:', error);
      throw error;
    }
  }
);

