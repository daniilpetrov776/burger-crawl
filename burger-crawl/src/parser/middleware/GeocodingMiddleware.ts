/**
 * Middleware для геокодинга адресов
 */

import type { IMiddleware } from '../interfaces.js';
import type { ParseResult, Coordinates } from '../types.js';
import type { IGeocoder } from '../interfaces.js';

export class GeocodingMiddleware implements IMiddleware {
  order = 1; // Выполняется первым после парсинга
  
  constructor(private geocoder: IGeocoder) {}

  async process(result: ParseResult): Promise<ParseResult> {
    const address = result.context.restaurantInfo?.address;
    
    if (!address || address === 'Не указан') {
      console.log('Адрес не указан, пропускаю геокодинг');
      return result;
    }
    
    console.log(`Геокодирую адрес: ${address}`);
    
    try {
      const coordinates = await this.geocoder.geocode(address);
      
      if (coordinates) {
        result.context.restaurantInfo = {
          ...result.context.restaurantInfo,
          coordinates
        };
        
        // Добавляем координаты к каждому блюду
        result.dishes = result.dishes.map(dish => ({
          ...dish,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        }));
        
        console.log(`Координаты найдены: ${coordinates.latitude}, ${coordinates.longitude}`);
      } else {
        console.log('Координаты не найдены');
      }
    } catch (error) {
      console.error('Ошибка при геокодинге:', error instanceof Error ? error.message : String(error));
    }
    
    return result;
  }
}

