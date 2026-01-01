/**
 * Группировщик по адресам
 */

import type { IGrouper } from '../interfaces.js';
import type { ParseResult, Dish, ParseContext } from '../types.js';

export class AddressGrouper implements IGrouper {
  getGroupKey(dish: Dish, context: ParseContext): string {
    return context.restaurantInfo?.address || 'Не указан';
  }

  async group(result: ParseResult): Promise<Record<string, Dish[]>> {
    const grouped: Record<string, Dish[]> = {};
    
    for (const dish of result.dishes) {
      const key = this.getGroupKey(dish, result.context);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(dish);
    }
    
    return grouped;
  }
}

