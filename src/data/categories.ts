import { Category } from '../types';
import { CATEGORIES_BATCH_1 } from './categoriesBatch1';
import { CATEGORIES_BATCH_2 } from './categoriesBatch2';
import { CATEGORIES_BATCH_3 } from './categoriesBatch3';
import { CATEGORIES_BATCH_4 } from './categoriesBatch4';

export const INITIAL_CATEGORIES: Category[] = [
  ...CATEGORIES_BATCH_1,
  ...CATEGORIES_BATCH_2,
  ...CATEGORIES_BATCH_3,
  ...CATEGORIES_BATCH_4,
];
