/**
 * Интерфейсы для Dependency Injection
 */

import type { Dish, ParseContext, ParseResult, Coordinates } from './types.js';

/**
 * Интерфейс для геокодера - преобразует адрес в координаты
 */
export interface IGeocoder {
  /**
   * Геокодирует адрес в координаты
   * @param address - адрес в текстовом формате
   * @returns координаты или null, если не удалось найти
   */
  geocode(address: string): Promise<Coordinates | null>;
}

/**
 * Интерфейс для middleware - обрабатывает данные после парсинга
 */
export interface IMiddleware {
  /**
   * Обрабатывает результат парсинга
   * @param result - результат парсинга
   * @returns обработанный результат
   */
  process(result: ParseResult): Promise<ParseResult>;
  
  /**
   * Порядок выполнения middleware (меньше = раньше)
   */
  order?: number;
}

/**
 * Интерфейс для экспортера - сохраняет данные в различные форматы
 */
export interface IExporter {
  /**
   * Экспортирует данные в файл
   * @param result - результат парсинга
   * @param filePath - путь к файлу
   */
  export(result: ParseResult, filePath: string): Promise<void>;
  
  /**
   * Возвращает расширение файла для этого экспортера
   */
  getFileExtension(): string;
}

/**
 * Интерфейс для селектора адреса - выбирает адрес на странице
 */
export interface IAddressSelector {
  /**
   * Выбирает адрес на странице
   * @param page - страница Puppeteer
   * @param targetAddress - целевой адрес для выбора
   * @returns выбранный адрес
   */
  selectAddress(page: any, targetAddress?: string): Promise<string | null>;
  
  /**
   * Извлекает текущий адрес со страницы
   * @param page - страница Puppeteer
   * @returns адрес или null
   */
  extractAddress(page: any): Promise<string | null>;
}

/**
 * Интерфейс для парсера страницы - извлекает данные со страницы
 */
export interface IPageParser {
  /**
   * Парсит страницу и извлекает блюда
   * @param page - страница Puppeteer
   * @param context - контекст парсинга
   * @returns массив блюд
   */
  parse(page: any, context: ParseContext): Promise<Dish[]>;
}

/**
 * Интерфейс для группировщика - группирует данные по определенным критериям
 */
export interface IGrouper {
  /**
   * Группирует блюда
   * @param result - результат парсинга
   * @returns сгруппированные данные
   */
  group(result: ParseResult): Promise<Record<string, Dish[]>>;
  
  /**
   * Возвращает ключ группировки для блюда
   * @param dish - блюдо
   * @param context - контекст
   * @returns ключ группировки
   */
  getGroupKey(dish: Dish, context: ParseContext): string;
}

