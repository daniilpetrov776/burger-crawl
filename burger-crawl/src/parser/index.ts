/**
 * Главный файл для экспорта всех компонентов парсера
 */

export * from './types.js';
export * from './interfaces.js';
export { BaseParser } from './BaseParser.js';
export { BurgerKingPageParser } from './parsers/BurgerKingPageParser.js';
export { GeocodingMiddleware } from './middleware/GeocodingMiddleware.js';
export { NominatimGeocoder } from './geocoders/NominatimGeocoder.js';
export { CSVExporter } from './exporters/CSVExporter.js';
export { AddressGrouper } from './groupers/AddressGrouper.js';
export { SimpleAddressSelector } from './selectors/SimpleAddressSelector.js';
export { BurgerKingSetup } from './setup/BurgerKingSetup.js';
export { ParserCoordinator } from './coordinator/ParserCoordinator.js';
export type { CoordinatorConfig, ParserInstance } from './coordinator/ParserCoordinator.js';
export { countOpenRestaurants } from './utils/RestaurantCounter.js';
export type { CountRestaurantsResult } from './utils/RestaurantCounter.js';

