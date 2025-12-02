export interface Cocktail {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  alcoholic: AlcoholicType;
  glassType?: string;
  garnish?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AlcoholicType = 'Alcoholic' | 'Non-Alcoholic' | 'Optional';

export type CreateCocktailInput = Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateCocktailInput = Partial<CreateCocktailInput>;

