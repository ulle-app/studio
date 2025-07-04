
// @ts-nocheck
// TODO: Fix this file
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe'; // Single recipe type for individual items

interface IngredientFormProps {
  formAction: (prevState: any, formData: FormData) => Promise<{ recipes?: GenerateRecipeOutput[]; error?: string; inputError?: string }>;
  onRecipeGenerated: (recipes: GenerateRecipeOutput[]) => void; // Expects an array of recipes
  onError: (message: string) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-6 text-base rounded-lg shadow-md transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95 focus:ring-2 focus:ring-accent/50 focus:ring-offset-2"
      aria-live="polite"
      aria-busy={pending ? 'true' : 'false'}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generating Recipes...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Recipes
        </>
      )}
    </Button>
  );
}

export function IngredientForm({ formAction, onRecipeGenerated, onError }: IngredientFormProps) {
  const initialState: { recipes?: GenerateRecipeOutput[]; error?: string; inputError?: string } = {};
  const [state, dispatch] = useActionState(formAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const ingredientsTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    console.log('[IngredientForm] Form state changed:', state);
    if (state?.recipes && Array.isArray(state.recipes)) {
      console.log('[IngredientForm] Recipes generated, calling onRecipeGenerated with count:', state.recipes.length);
      onRecipeGenerated(state.recipes); // Pass the array of recipes
      if (formRef.current) {
        formRef.current.reset(); 
      }
      if (ingredientsTextAreaRef.current) {
        ingredientsTextAreaRef.current.focus();
      }
    }
    
    if (state?.error && !state?.recipes) {
      console.error('[IngredientForm] Error received from action, calling onError:', state.error);
      onError(state.error);
    }
    if (state?.inputError && !state?.recipes) {
      console.warn('[IngredientForm] Input error received from action:', state.inputError);
    }
  }, [state, onRecipeGenerated, onError]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        const ingredients = formData.get('ingredients') as string;
        if (ingredients && ingredients.trim().length > 0) {
          formRef.current.requestSubmit();
        }
      }
    }
  };

  return (
    <form action={dispatch} ref={formRef} className="space-y-6">
      <div>
        <Label htmlFor="ingredients" className="block text-xl font-medium text-foreground mb-3">
          What ingredients do you have?
        </Label>
        <Textarea
          ref={ingredientsTextAreaRef}
          id="ingredients"
          name="ingredients"
          placeholder="e.g., chicken, onion, tomatoes, basmati rice, ginger"
          rows={5}
          className="focus:ring-accent focus:border-accent text-base p-3 rounded-lg shadow-sm border-border"
          aria-describedby="ingredients-error ingredients-hint"
          required
          aria-invalid={!!state?.inputError}
          onKeyDown={handleKeyDown}
        />
        {state?.inputError && !state?.recipes && (
          <p id="ingredients-error" className="mt-2 text-sm text-destructive font-medium">
            {state.inputError}
          </p>
        )}
        <p id="ingredients-hint" className="mt-2 text-sm text-muted-foreground">
          Enter ingredients separated by commas. The more, the merrier! (Max 500 characters) Press Enter to generate.
        </p>
      </div>
      <SubmitButton />
    </form>
  );
}

