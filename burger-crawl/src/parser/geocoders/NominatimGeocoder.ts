/**
 * Геокодер на основе Nominatim (OpenStreetMap)
 */

import axios from 'axios';
import type { IGeocoder } from '../interfaces.js';
import type { Coordinates } from '../types.js';

export class NominatimGeocoder implements IGeocoder {
  private baseUrl = 'https://nominatim.openstreetmap.org/search';
  private delay: number;

  constructor(delayMs: number = 1000) {
    this.delay = delayMs; // Задержка для соблюдения rate limit (1 запрос/сек)
  }

  async geocode(address: string): Promise<Coordinates | null> {
    // Задержка для соблюдения rate limit
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          countrycodes: 'ru', // Ограничиваем поиск Россией
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'BurgerKingParser/1.0' // Требуется для Nominatim
        }
      });
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        return {
          latitude: lat,
          longitude: lon,
          displayName: result.display_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при геокодинге через Nominatim:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }
}

