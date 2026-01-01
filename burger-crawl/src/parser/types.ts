/**
 * Базовые типы данных для парсера
 */

/**
 * Базовый тип для блюда/товара
 */
export interface Dish {
  dataDish: string;
  name?: string;
  price?: string;
  image?: string;
  [key: string]: unknown; // Для дополнительных полей из middleware
}

/**
 * Геокоординаты
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  displayName?: string;
}

/**
 * Информация о ресторане/точке
 */
export interface RestaurantInfo {
  address?: string;
  coordinates?: Coordinates;
  restaurantId?: string;
  [key: string]: unknown;
}

/**
 * Контекст парсинга - содержит информацию о текущей сессии
 */
export interface ParseContext {
  url: string;
  restaurantInfo?: RestaurantInfo;
  metadata?: Record<string, unknown>;
}

/**
 * Результат парсинга
 */
export interface ParseResult {
  dishes: Dish[];
  context: ParseContext;
}

/**
 * Конфигурация парсера
 */
export interface ParserConfig {
  url: string;
  headless?: boolean;
  timeout?: number;
  waitForSelector?: string;
  userAgent?: string;
  browserArgs?: string[];
}

