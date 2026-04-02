export interface Outfit {
  id?: string;
  outfitName: string;
  occasion: string;
  pieces: {
    top: string;
    bottom: string;
    shoes: string;
    bag: string;
    accessories: string;
    outerwear: string | null;
  };
  colorPalette: string[];
  stylingTip: string;
  budgetRange: string;
  shopAt: string[];
  season: string;
  createdAt?: any;
  rating?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  stylePersona?: string;
  bodyType?: string;
  budgetTier?: string;
  gender?: string;
  colorPreferences?: string[];
  darkMode?: boolean;
}

export interface WeeklyPlan {
  id?: string;
  title: string;
  context: string;
  outfits: { [day: string]: Outfit };
  createdAt?: any;
}
