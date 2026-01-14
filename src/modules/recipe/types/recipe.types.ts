export interface Recipe {
  id: string;           // UUID from Supabase
  title: string;
  ingredients: string;
  instructions?: string;
  category: RecipeCategory;
  servings?: number;
  prepTime?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type RecipeCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snack' | 'Drink';

export type CreateRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateRecipeInput = Partial<CreateRecipeInput>;

