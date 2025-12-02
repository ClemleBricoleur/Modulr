import { useState, useEffect } from 'react';
import { Plus, Trash2, ChefHat, Search } from 'lucide-react';
import { Header } from '../../core/components/Header';
import { Card } from '../../core/components/Card';
import { RecipeService } from './services/recipeService';
import type { Recipe, RecipeCategory } from './types/recipe.types';

interface RecipeModuleProps {
  goHome: () => void;
}

const CATEGORIES: RecipeCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink'];

export const RecipeModule = ({ goHome }: RecipeModuleProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newCategory, setNewCategory] = useState<RecipeCategory>('Dinner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = searchQuery 
        ? await RecipeService.search(searchQuery)
        : await RecipeService.getAll();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecipes();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await RecipeService.add({
        title: newTitle.trim(),
        ingredients: newIngredients.trim(),
        instructions: newInstructions.trim(),
        category: newCategory,
      });

      // Reset form
      setNewTitle('');
      setNewIngredients('');
      setNewInstructions('');
      setNewCategory('Dinner');
      
      // Reload list
      await loadRecipes();
    } catch (error) {
      console.error('Failed to add recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await RecipeService.delete(id);
      await loadRecipes();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header title="My Recipes" onBack={goHome} className="bg-indigo-600" />

      <main className="p-4 max-w-md mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Creation Form */}
        <Card className="animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ChefHat size={16} />
            New Recipe
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Recipe title (e.g., Pasta Carbonara)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as RecipeCategory)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <textarea
              placeholder="Ingredients (one per line)..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
              value={newIngredients}
              onChange={e => setNewIngredients(e.target.value)}
            />

            <textarea
              placeholder="Instructions (optional)..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
              value={newInstructions}
              onChange={e => setNewInstructions(e.target.value)}
            />

            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  Add to Cookbook
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Recipe List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Your Collection ({recipes.length})</span>
            {loading && (
              <span className="text-xs text-indigo-500 animate-pulse">Syncing...</span>
            )}
          </h2>

          {recipes.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400">
              <ChefHat size={48} className="mx-auto mb-4 opacity-30" />
              <p>No recipes yet.</p>
              <p className="text-sm">Add your first recipe above!</p>
            </div>
          )}

          {recipes.map((recipe, index) => (
            <Card 
              key={recipe.id} 
              className="flex justify-between items-start animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800 truncate">{recipe.title}</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                    {recipe.category}
                  </span>
                </div>
                {recipe.ingredients && (
                  <p className="text-sm text-slate-500 line-clamp-2">{recipe.ingredients}</p>
                )}
                {recipe.instructions && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{recipe.instructions}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(recipe.id)}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors shrink-0"
                aria-label="Delete recipe"
              >
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

