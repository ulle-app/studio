
'use server';
/**
 * @fileOverview Generates an image for a given recipe name.
 *
 * - generateRecipeImage - A function that handles the recipe image generation process.
 * - GenerateRecipeImageInput - The input type for the generateRecipeImage function.
 * - GenerateRecipeImageOutput - The return type for the generateRecipeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe for which to generate an image.'),
});
export type GenerateRecipeImageInput = z.infer<typeof GenerateRecipeImageInputSchema>;

const GenerateRecipeImageOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateRecipeImageOutput = z.infer<typeof GenerateRecipeImageOutputSchema>;

export async function generateRecipeImage(input: GenerateRecipeImageInput): Promise<GenerateRecipeImageOutput> {
  console.log('[Flow:generateRecipeImage] Exported function called with input:', input);
  return generateRecipeImageFlow(input);
}

const generateRecipeImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeImageFlow',
    inputSchema: GenerateRecipeImageInputSchema,
    outputSchema: GenerateRecipeImageOutputSchema,
  },
  async (input: GenerateRecipeImageInput) => {
    console.log('[Flow:generateRecipeImageFlow] Flow started with input:', input.recipeName);
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Specific model for image generation
        prompt: `Generate a visually appealing and appetizing photograph-style image of the Indian dish named "${input.recipeName}". The image should be high quality, well-lit, and suitable for a recipe website. Focus on the food itself.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
        },
      });

      if (!media || !media.url) {
        console.error('[Flow:generateRecipeImageFlow] Image generation failed or returned no URL.');
        throw new Error('Image generation failed to produce an image.');
      }
      console.log('[Flow:generateRecipeImageFlow] Image generated successfully:', media.url.substring(0, 50) + '...'); // Log only a snippet
      return {imageDataUri: media.url};
    } catch (error) {
      console.error('[Flow:generateRecipeImageFlow] Error during image generation:', error);
      throw error;
    }
  }
);
