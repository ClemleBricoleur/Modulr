import { useState, useEffect } from 'react';
import { Plus, Trash2, Martini, Search, Wine } from 'lucide-react';
import { Header } from '../../core/components/Header';
import { Card } from '../../core/components/Card';
import { CocktailService } from './services/cocktailService';
import type { Cocktail, AlcoholicType } from './types/cocktail.types';

interface CocktailModuleProps {
  goHome: () => void;
}

const ALCOHOLIC_TYPES: AlcoholicType[] = ['Alcoholic', 'Non-Alcoholic', 'Optional'];

export const CocktailModule = ({ goHome }: CocktailModuleProps) => {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [newName, setNewName] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newAlcoholic, setNewAlcoholic] = useState<AlcoholicType>('Alcoholic');
  const [newGlassType, setNewGlassType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load cocktails on mount
  useEffect(() => {
    loadCocktails();
  }, []);

  const loadCocktails = async () => {
    setLoading(true);
    try {
      const data = searchQuery
        ? await CocktailService.search(searchQuery)
        : await CocktailService.getAll();
      setCocktails(data);
    } catch (error) {
      console.error('Failed to load cocktails:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCocktails();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await CocktailService.add({
        name: newName.trim(),
        ingredients: newIngredients.trim(),
        instructions: newInstructions.trim(),
        alcoholic: newAlcoholic,
        glassType: newGlassType.trim() || undefined,
      });

      // Reset form
      setNewName('');
      setNewIngredients('');
      setNewInstructions('');
      setNewAlcoholic('Alcoholic');
      setNewGlassType('');

      // Reload list
      await loadCocktails();
    } catch (error) {
      console.error('Failed to add cocktail:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await CocktailService.delete(id);
      await loadCocktails();
    } catch (error) {
      console.error('Failed to delete cocktail:', error);
    }
  };

  const getAlcoholicBadgeColor = (type: AlcoholicType) => {
    switch (type) {
      case 'Alcoholic':
        return 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300';
      case 'Non-Alcoholic':
        return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
      default:
        return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 dark:bg-slate-900 pb-20">
      <Header title="Bar Master" onBack={goHome} className="bg-rose-600" />

      <main className="p-4 max-w-md mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search cocktails..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Creation Form */}
        <Card className="animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Martini size={16} />
            New Cocktail
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Cocktail name (e.g., Mojito)"
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={newAlcoholic}
                onChange={e => setNewAlcoholic(e.target.value as AlcoholicType)}
              >
                {ALCOHOLIC_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Glass type"
                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={newGlassType}
                onChange={e => setNewGlassType(e.target.value)}
              />
            </div>

            <textarea
              placeholder="Ingredients (e.g., 2oz Rum, 1oz Lime juice...)"
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
              value={newIngredients}
              onChange={e => setNewIngredients(e.target.value)}
            />

            <textarea
              placeholder="Instructions (how to mix)..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
              value={newInstructions}
              onChange={e => setNewInstructions(e.target.value)}
            />

            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 dark:disabled:bg-rose-800 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  Add to Bar
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Cocktail List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>Your Collection ({cocktails.length})</span>
            {loading && (
              <span className="text-xs text-rose-500 dark:text-rose-400 animate-pulse">Syncing...</span>
            )}
          </h2>

          {cocktails.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Wine size={48} className="mx-auto mb-4 opacity-30" />
              <p>No cocktails yet.</p>
              <p className="text-sm">Add your first cocktail above!</p>
            </div>
          )}

          {cocktails.map((cocktail, index) => (
            <Card
              key={cocktail.id}
              className="flex justify-between items-start animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-slate-800 dark:text-white">{cocktail.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getAlcoholicBadgeColor(cocktail.alcoholic)}`}>
                    {cocktail.alcoholic}
                  </span>
                  {cocktail.glassType && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {cocktail.glassType}
                    </span>
                  )}
                </div>
                {cocktail.ingredients && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{cocktail.ingredients}</p>
                )}
                {cocktail.instructions && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2">{cocktail.instructions}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(cocktail.id)}
                className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors shrink-0"
                aria-label="Delete cocktail"
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
