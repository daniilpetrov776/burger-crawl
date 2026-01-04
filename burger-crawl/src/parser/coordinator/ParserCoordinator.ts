/**
 * Координатор для параллельного запуска нескольких парсеров
 * Обеспечивает распределение индексов ресторанов между инстансами
 */

import type { ParseResult } from '../types.js';
import type { BaseParser } from '../BaseParser.js';

export interface CoordinatorConfig {
  totalRestaurants: number; // Общее количество ресторанов для парсинга
  parallelInstances: number; // Количество параллельных инстансов
  startIndex?: number; // Начальный индекс (по умолчанию 0)
}

export interface ParserInstance {
  parser: BaseParser;
  instanceId: number;
}

export class ParserCoordinator {
  private config: CoordinatorConfig;
  private processedIndices: Set<number> = new Set();
  private results: ParseResult[] = [];
  private errors: Array<{ index: number; error: Error }> = [];

  constructor(config: CoordinatorConfig) {
    this.config = {
      startIndex: 0,
      ...config
    };
  }

  /**
   * Распределяет индексы ресторанов между инстансами
   */
  private distributeIndices(): Map<number, number[]> {
    const distribution = new Map<number, number[]>();
    const { totalRestaurants, parallelInstances, startIndex = 0 } = this.config;

    // Распределяем индексы по кругу между инстансами
    for (let i = 0; i < totalRestaurants; i++) {
      const restaurantIndex = startIndex + i;
      const instanceId = i % parallelInstances;
      
      if (!distribution.has(instanceId)) {
        distribution.set(instanceId, []);
      }
      distribution.get(instanceId)!.push(restaurantIndex);
    }

    return distribution;
  }

  /**
   * Запускает парсинг для одного инстанса с его набором индексов
   */
  private async runInstance(
    instanceId: number,
    indices: number[],
    parserFactory: (startIndex: number) => BaseParser
  ): Promise<ParseResult[]> {
    const instanceResults: ParseResult[] = [];
    
    console.log(`[Инстанс ${instanceId}] Начинаю парсинг ${indices.length} ресторанов: индексы ${indices.join(', ')}`);
    
    for (const restaurantIndex of indices) {
      try {
        // Создаем новый парсер для каждого индекса с правильным начальным индексом
        const parser = parserFactory(restaurantIndex);
        
        console.log(`[Инстанс ${instanceId}] Парсинг ресторана с индексом ${restaurantIndex}...`);
        const result = await parser.parse();
        
        instanceResults.push(result);
        this.processedIndices.add(restaurantIndex);
        
        console.log(`[Инстанс ${instanceId}] Ресторан ${restaurantIndex} обработан. Найдено блюд: ${result.dishes.length}`);
        
        // Небольшая задержка между ресторанами в одном инстансе
        if (restaurantIndex !== indices[indices.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[Инстанс ${instanceId}] Ошибка при парсинге ресторана ${restaurantIndex}:`, err.message);
        this.errors.push({ index: restaurantIndex, error: err });
      }
    }
    
    console.log(`[Инстанс ${instanceId}] Завершен. Обработано ресторанов: ${instanceResults.length}`);
    return instanceResults;
  }

  /**
   * Запускает параллельный парсинг
   * @param parserFactory - функция для создания парсера с заданным начальным индексом
   */
  async runParallel(
    parserFactory: (startIndex: number) => BaseParser
  ): Promise<{
    results: ParseResult[];
    processedIndices: number[];
    errors: Array<{ index: number; error: Error }>;
  }> {
    const distribution = this.distributeIndices();
    
    console.log('\n' + '='.repeat(80));
    console.log('Запуск параллельного парсинга');
    console.log(`Всего ресторанов: ${this.config.totalRestaurants}`);
    console.log(`Параллельных инстансов: ${this.config.parallelInstances}`);
    console.log('='.repeat(80));
    
    // Выводим распределение
    distribution.forEach((indices, instanceId) => {
      console.log(`Инстанс ${instanceId}: индексы ${indices.join(', ')}`);
    });
    console.log('');

    // Запускаем все инстансы параллельно
    const promises = Array.from(distribution.entries()).map(([instanceId, indices]) =>
      this.runInstance(instanceId, indices, parserFactory)
    );

    // Ждем завершения всех инстансов
    const allResults = await Promise.all(promises);
    
    // Объединяем результаты
    this.results = allResults.flat();

    console.log('\n' + '='.repeat(80));
    console.log('Параллельный парсинг завершен');
    console.log(`Обработано ресторанов: ${this.processedIndices.size}/${this.config.totalRestaurants}`);
    console.log(`Всего найдено блюд: ${this.results.reduce((sum, r) => sum + r.dishes.length, 0)}`);
    console.log(`Ошибок: ${this.errors.length}`);
    console.log('='.repeat(80));

    return {
      results: this.results,
      processedIndices: Array.from(this.processedIndices).sort((a, b) => a - b),
      errors: this.errors
    };
  }

  /**
   * Объединяет все результаты в один
   */
  combineResults(): ParseResult {
    const allDishes = this.results.flatMap(result => {
      const address = result.context.restaurantInfo?.address || 'Не указан';
      const coordinates = result.context.restaurantInfo?.coordinates;
      
      return result.dishes.map(dish => ({
        ...dish,
        address: dish.address || address,
        latitude: dish.latitude || coordinates?.latitude,
        longitude: dish.longitude || coordinates?.longitude
      }));
    });

    return {
      dishes: allDishes,
      context: {
        url: this.results[0]?.context.url || '',
        restaurantInfo: {
          address: `Всего ресторанов: ${this.results.length}`,
          coordinates: this.results[0]?.context.restaurantInfo?.coordinates
        }
      }
    };
  }
}

