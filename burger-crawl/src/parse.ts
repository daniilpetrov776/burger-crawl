/**
 * Главный скрипт для запуска парсера
 */

import {
  BaseParser,
  BurgerKingPageParser,
  GeocodingMiddleware,
  NominatimGeocoder,
  CSVExporter,
  SimpleAddressSelector,
  BurgerKingSetup
} from './parser/index.js';

const URL = 'https://burgerkingrus.ru/';

async function main() {
  // Создаем компоненты
  const pageParser = new BurgerKingPageParser();
  const geocoder = new NominatimGeocoder(1000); // Задержка 1 сек между запросами
  const geocodingMiddleware = new GeocodingMiddleware(geocoder);
  const csvExporter = new CSVExporter();
  const addressSelector = new SimpleAddressSelector();
  const setup = new BurgerKingSetup();

  // Создаем парсер с DI
  const parser = new BaseParser(
    {
      url: URL,
      headless: true,
      waitForSelector: '[data-dish]'
    },
    pageParser,
    {
      middlewares: [geocodingMiddleware],
      exporter: csvExporter,
      addressSelector: addressSelector,
      setup: setup,
      restaurantIndex: 0 // Начинаем с первого ресторана
    }
  );

  try {
    // // Вариант 1: Парсинг одного адреса (текущий)
    // console.log('Начинаю парсинг...\n');
    // const result = await parser.parse();
    
    // // Выводим статистику
    // console.log(`\n${'='.repeat(80)}`);
    // console.log(`Найдено товаров: ${result.dishes.length}`);
    // if (result.context.restaurantInfo?.address) {
    //   console.log(`Адрес: ${result.context.restaurantInfo.address}`);
    // }
    // if (result.context.restaurantInfo?.coordinates) {
    //   const coords = result.context.restaurantInfo.coordinates;
    //   console.log(`Координаты: ${coords.latitude}, ${coords.longitude}`);
    // }
    // console.log('='.repeat(80));

    // // Экспортируем результат
    // await parser.export(result, 'dishes.csv');
    
    // // Также копируем в public для React приложения
    // try {
    //   await parser.export(result, 'public/dishes.csv');
    //   console.log('Результаты также сохранены в public/dishes.csv');
    // } catch (err) {
    //   console.log('Не удалось сохранить в public/dishes.csv (это нормально, если папки нет)');
    // }

    // Вариант 2: Парсинг нескольких ресторанов (автоматически увеличивает индекс)
    
    console.log('Парсинг нескольких ресторанов...\n');
    const results = await parser.parseMultipleRestaurants(2); // Парсим 2 ресторана
    
    // Объединяем все результаты, сохраняя адрес из каждого результата
    const allDishes = results.flatMap(result => {
      const address = result.context.restaurantInfo?.address || 'Не указан';
      const coordinates = result.context.restaurantInfo?.coordinates;
      
      // Добавляем адрес и координаты к каждому блюду из этого результата
      return result.dishes.map(dish => ({
        ...dish,
        address: dish.address || address,
        latitude: dish.latitude || coordinates?.latitude,
        longitude: dish.longitude || coordinates?.longitude
      }));
    });
    
    const combinedResult = {
      dishes: allDishes,
      context: {
        url: URL,
        restaurantInfo: {
          // Берем информацию из первого результата для общего контекста
          address: results[0]?.context.restaurantInfo?.address,
          coordinates: results[0]?.context.restaurantInfo?.coordinates
        }
      }
    };
    
    await parser.export(combinedResult, 'dishes_all.csv');
    
    // Или экспортируем каждый ресторан отдельно
    // await parser.exportMultiple(results, 'dishes');
    

  } catch (error) {
    console.error('Ошибка:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);

