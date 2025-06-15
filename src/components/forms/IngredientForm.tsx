// @ts-nocheck
// TODO: Fix this file
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { useEffect, useRef } from 'react';

interface IngredientFormProps {
  formAction: (prevState: any, formData: FormData) => Promise<{ recipe?: GenerateRecipeOutput; error?: string; inputError?: string }>;
  onRecipeGenerated: (recipe: GenerateRecipeOutput) => void;
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
          Generating Recipe...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Recipe
        </>
      )}
    </Button>
  );
}

export function IngredientForm({ formAction, onRecipeGenerated, onError }: IngredientFormProps) {
  const initialState: { recipe?: GenerateRecipeOutput; error?: string; inputError?: string } = {};
  const [state, dispatch] = useFormState(formAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const ingredientsTextAreaRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (state?.recipe) {
      onRecipeGenerated(state.recipe);
      if (formRef.current) {
        formRef.current.reset(); 
      }
       // Focus back to the textarea after successful submission and form reset for better UX
      if (ingredientsTextAreaRef.current) {
        ingredientsTextAreaRef.current.focus();
      }
    }
    // Only call onError if there's an error message and no recipe was generated.
    // This prevents showing an error toast if there was a previous error but a new recipe is successfully generated.
    if (state?.error && !state?.recipe) {
      onError(state.error);
    }
  }, [state, onRecipeGenerated, onError]);

  return (
    <form action={dispatch} ref={formRef} className="space-y-6">
      <div>
        <Label htmlFor="ingredients" className="block text-xl font-medium text-foreground mb-3">
          What's in your fridge?
        </Label>
        <Textarea
          ref={ingredientsTextAreaRef}
          id="ingredients"
          name="ingredients"
          placeholder="e.g., chicken breast, broccoli, soy sauce, rice"
          rows={5}
          className="focus:ring-accent focus:border-accent text-base p-3 rounded-lg shadow-sm border-border"
          aria-describedby="ingredients-error ingredients-hint"
          required
          aria-invalid={!!state?.inputError}
        />
        {state?.inputError && !state?.recipe && ( // Only show input error if there's no recipe (i.e., current submission failed)
          <p id="ingredients-error" className="mt-2 text-sm text-destructive font-medium">
            {state.inputError}
          </p>
        )}
        <p id="ingredients-hint" className="mt-2 text-sm text-muted-foreground">
          Enter ingredients separated by commas. The more, the merrier! (Max 500 characters)
        </p>
      </div>
      <SubmitButton />
    </form>
  );
}
