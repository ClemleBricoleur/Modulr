import { API_CONFIG, simulateDelay } from '../../../core/config/api.config';
import type { Cocktail, CreateCocktailInput, UpdateCocktailInput } from '../types/cocktail.types';

const STORAGE_KEY = 'modulr_cocktails';

/**
 * Cocktail Service
 * 
 * Handles all cocktail CRUD operations.
 * Currently uses LocalStorage, but ready for server migration.
 */
export const CocktailService = {
    /**
     * Get all cocktails
     */
    async getAll(): Promise<Cocktail[]> {
        await simulateDelay();

        if (API_CONFIG.USE_SERVER) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/cocktails`);
            if (!res.ok) throw new Error('Failed to fetch cocktails');
            return res.json();
        }

        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Get a single cocktail by ID
     */
    async getById(id: number): Promise<Cocktail | null> {
        await simulateDelay();

        if (API_CONFIG.USE_SERVER) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/cocktails/${id}`);
            if (!res.ok) return null;
            return res.json();
        }

        const all = await this.getAll();
        return all.find(c => c.id === id) || null;
    },

    /**
     * Create a new cocktail
     */
    async add(input: CreateCocktailInput): Promise<Cocktail> {
        await simulateDelay();

        if (API_CONFIG.USE_SERVER) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/cocktails`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            if (!res.ok) throw new Error('Failed to create cocktail');
            return res.json();
        }

        const current = await this.getAll();
        const newCocktail: Cocktail = {
            ...input,
            id: Date.now(),
            createdAt: new Date().toISOString(),
        };
        const updated = [newCocktail, ...current];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newCocktail;
    },

    /**
     * Update an existing cocktail
     */
    async update(id: number, input: UpdateCocktailInput): Promise<Cocktail | null> {
        await simulateDelay();

        if (API_CONFIG.USE_SERVER) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/cocktails/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            if (!res.ok) return null;
            return res.json();
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
    async delete(id: number): Promise<boolean> {
        await simulateDelay();

        if (API_CONFIG.USE_SERVER) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/cocktails/${id}`, {
                method: 'DELETE',
            });
            return res.ok;
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

