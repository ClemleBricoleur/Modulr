import { API_CONFIG, simulateDelay } from '../../../core/config/api.config';
import { supabase } from '../../../core/config/supabase.config';
import { ensureAuthenticated, handleSupabaseError } from '../../../core/lib/supabaseService';
import type { Recipe, CreateRecipeInput, UpdateRecipeInput } from '../types/recipe.types';

const STORAGE_KEY = 'modulr_recipes';

/**
 * Database row type from Supabase
 */
interface RecipeRow {
  id: string;
  user_id: string;
  title: string;
  ingredients: string;
  instructions: string | null;
  category: string;
  servings: number | null;
  prep_time: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to Recipe
 */
function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    ingredients: row.ingredients,
    instructions: row.instructions || undefined,
    category: row.category as Recipe['category'],
    servings: row.servings || undefined,
    prepTime: row.prep_time || undefined,
    imageUrl: row.image_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

/**
 * Recipe Service
 * 
 * Handles all recipe CRUD operations.
 * Uses Supabase for persistence when enabled, falls back to localStorage.
 */
export const RecipeService = {
  /**
   * Get all recipes
   */
  async getAll(): Promise<Recipe[]> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch recipes');

      return (data || []).map(rowToRecipe);
    }

    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get a single recipe by ID
   */
  async getById(id: string): Promise<Recipe | null> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        handleSupabaseError(error, 'fetch recipe');
      }

      return data ? rowToRecipe(data) : null;
    }

    const all = await this.getAll();
    return all.find(r => r.id === id) || null;
  },

  /**
   * Create a new recipe
   */
  async add(input: CreateRecipeInput): Promise<Recipe> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          title: input.title,
          ingredients: input.ingredients,
          instructions: input.instructions || null,
          category: input.category,
          servings: input.servings || null,
          prep_time: input.prepTime || null,
          image_url: input.imageUrl || null,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'create recipe');

      return rowToRecipe(data);
    }

    const current = await this.getAll();
    const newRecipe: Recipe = {
      ...input,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecipe, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecipe;
  },

  /**
   * Update an existing recipe
   */
  async update(id: string, input: UpdateRecipeInput): Promise<Recipe | null> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.ingredients !== undefined) updateData.ingredients = input.ingredients;
      if (input.instructions !== undefined) updateData.instructions = input.instructions;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.servings !== undefined) updateData.servings = input.servings;
      if (input.prepTime !== undefined) updateData.prep_time = input.prepTime;
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;

      const { data, error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        handleSupabaseError(error, 'update recipe');
      }

      return data ? rowToRecipe(data) : null;
    }

    const current = await this.getAll();
    const index = current.findIndex(r => r.id === id);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current[index];
  },

  /**
   * Delete a recipe
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete recipe error:', error);
        return false;
      }

      return true;
    }

    const current = await this.getAll();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  /**
   * Search recipes by title or ingredients
   */
  async search(query: string): Promise<Recipe[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();
      const q = query.toLowerCase().trim();

      if (!q) {
        return this.getAll();
      }

      // Use ilike for case-insensitive search
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${q}%,ingredients.ilike.%${q}%,category.ilike.%${q}%`)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'search recipes');

      return (data || []).map(rowToRecipe);
    }

    const all = await this.getAll();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    
    return all.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.ingredients.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  },
};
