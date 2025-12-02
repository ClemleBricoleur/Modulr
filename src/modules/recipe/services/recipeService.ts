import { API_CONFIG, simulateDelay } from '../../../core/config/api.config';
import type { Recipe, CreateRecipeInput, UpdateRecipeInput } from '../types/recipe.types';

const STORAGE_KEY = 'modulr_recipes';

/**
 * Recipe Service
 * 
 * Handles all recipe CRUD operations.
 * Currently uses LocalStorage, but ready for server migration.
 */
export const RecipeService = {
  /**
   * Get all recipes
   */
  async getAll(): Promise<Recipe[]> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/recipes`);
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json();
    }

    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get a single recipe by ID
   */
  async getById(id: number): Promise<Recipe | null> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/recipes/${id}`);
      if (!res.ok) return null;
      return res.json();
    }

    const all = await this.getAll();
    return all.find(r => r.id === id) || null;
  },

  /**
   * Create a new recipe
   */
  async add(input: CreateRecipeInput): Promise<Recipe> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create recipe');
      return res.json();
    }

    const current = await this.getAll();
    const newRecipe: Recipe = {
      ...input,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecipe, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecipe;
  },

  /**
   * Update an existing recipe
   */
  async update(id: number, input: UpdateRecipeInput): Promise<Recipe | null> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) return null;
      return res.json();
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
  async delete(id: number): Promise<boolean> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/recipes/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
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

