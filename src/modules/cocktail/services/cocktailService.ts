import { API_CONFIG, simulateDelay } from '../../../core/config/api.config';
import { supabase } from '../../../core/config/supabase.config';
import { ensureAuthenticated, handleSupabaseError } from '../../../core/lib/supabaseService';
import type { Cocktail, CreateCocktailInput, UpdateCocktailInput } from '../types/cocktail.types';

const STORAGE_KEY = 'modulr_cocktails';

/**
 * Database row type from Supabase
 */
interface CocktailRow {
  id: string;
  user_id: string;
  name: string;
  ingredients: string;
  instructions: string;
  alcoholic: string;
  glass_type: string | null;
  garnish: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to Cocktail
 */
function rowToCocktail(row: CocktailRow): Cocktail {
  return {
    id: row.id,
    name: row.name,
    ingredients: row.ingredients,
    instructions: row.instructions,
    alcoholic: row.alcoholic as Cocktail['alcoholic'],
    glassType: row.glass_type || undefined,
    garnish: row.garnish || undefined,
    imageUrl: row.image_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

/**
 * Cocktail Service
 * 
 * Handles all cocktail CRUD operations.
 * Uses Supabase for persistence when enabled, falls back to localStorage.
 */
export const CocktailService = {
  /**
   * Get all cocktails
   */
  async getAll(): Promise<Cocktail[]> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('cocktails')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch cocktails');

      return (data || []).map(rowToCocktail);
    }

    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get a single cocktail by ID
   */
  async getById(id: string): Promise<Cocktail | null> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('cocktails')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        handleSupabaseError(error, 'fetch cocktail');
      }

      return data ? rowToCocktail(data) : null;
    }

    const all = await this.getAll();
    return all.find(c => c.id === id) || null;
  },

  /**
   * Create a new cocktail
   */
  async add(input: CreateCocktailInput): Promise<Cocktail> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('cocktails')
        .insert({
          user_id: userId,
          name: input.name,
          ingredients: input.ingredients,
          instructions: input.instructions,
          alcoholic: input.alcoholic,
          glass_type: input.glassType || null,
          garnish: input.garnish || null,
          image_url: input.imageUrl || null,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'create cocktail');

      return rowToCocktail(data);
    }

    const current = await this.getAll();
    const newCocktail: Cocktail = {
      ...input,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newCocktail, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newCocktail;
  },

  /**
   * Update an existing cocktail
   */
  async update(id: string, input: UpdateCocktailInput): Promise<Cocktail | null> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.ingredients !== undefined) updateData.ingredients = input.ingredients;
      if (input.instructions !== undefined) updateData.instructions = input.instructions;
      if (input.alcoholic !== undefined) updateData.alcoholic = input.alcoholic;
      if (input.glassType !== undefined) updateData.glass_type = input.glassType;
      if (input.garnish !== undefined) updateData.garnish = input.garnish;
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;

      const { data, error } = await supabase
        .from('cocktails')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        handleSupabaseError(error, 'update cocktail');
      }

      return data ? rowToCocktail(data) : null;
    }

    const current = await this.getAll();
    const index = current.findIndex(c => c.id === id);
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
   * Delete a cocktail
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { error } = await supabase
        .from('cocktails')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete cocktail error:', error);
        return false;
      }

      return true;
    }

    const current = await this.getAll();
    const updated = current.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  /**
   * Search cocktails by name or ingredients
   */
  async search(query: string): Promise<Cocktail[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();
      const q = query.toLowerCase().trim();

      if (!q) {
        return this.getAll();
      }

      // Use ilike for case-insensitive search
      const { data, error } = await supabase
        .from('cocktails')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${q}%,ingredients.ilike.%${q}%,alcoholic.ilike.%${q}%`)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'search cocktails');

      return (data || []).map(rowToCocktail);
    }

    const all = await this.getAll();
    const q = query.toLowerCase().trim();
    if (!q) return all;

    return all.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.ingredients.toLowerCase().includes(q) ||
      c.alcoholic.toLowerCase().includes(q)
    );
  },
};
