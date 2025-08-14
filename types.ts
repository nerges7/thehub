// Deporte
export interface Sport {
  id: string;
  name: string;
  description?: string;
}

// Categoría de producto
export interface Category {
  id: string;
  name: string;
  description?: string;
  sportIds: string[]; // IDs de los deportes relacionados
}

// Producto
export interface Product {
  id: string;
  shopifyGid: string;
  name: string;
  description?: string;
  categoryIds: string[];
  priority: number;
  amountPerUnit: number; 
}

// Pregunta asociada a un deporte
export interface Question {
  id: string;
  sports?: { sportId: string; order: number }[];
  text: string;
  key: string;
  type: 'select' | 'number' | 'text'| 'time' | 'distance' | 'multitime'; 
  options?: string[];
  unit?: string;
   timeComponents?: {
    label: string;
    key: string;
  }[];
  forAllSports?: boolean;
}


export interface Rule {
  id: string;
  categoryId: string;
  baseQuestionKey: string;
  baseMultiplier: number;
  baseQuestionType: 'number' | 'time' | 'distance' | 'multitime';
  logic: 'AND' | 'OR';
  modifiers: {
    key: string;
    value: string;
    multiplier: number;
  }[];
}
