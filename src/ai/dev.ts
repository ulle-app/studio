
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recipe.ts';
import '@/ai/flows/improve-recipe.ts';
import '@/ai/flows/translate-recipe.ts';
import '@/ai/flows/generate-recipe-image.ts';

