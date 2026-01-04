/**
 * Пример параллельного запуска нескольких парсеров
 */

import {
  BaseParser,
  BurgerKingPageParser,
  GeocodingMiddleware,
  NominatimGeocoder,
  CSVExporter,
  SimpleAddressSelector,
  BurgerKingSetup,
  ParserCoordinator,
  countOpenRestaurants
} from './parser/index.js';

const URL = 'https://burgerkingrus.ru/';

/**
 * Фабрика для создания парсера с заданным начальным индексом
 */
function createParser(startIndex: number): BaseParser {
  const pageParser = new BurgerKingPageParser();
  const geocoder = new NominatimGeocoder(1000);
  const geocodingMiddleware = new GeocodingMiddleware(geocoder);
  const csvExporter = new CSVExporter();
  const addressSelector = new SimpleAddressSelector();
  const setup = new BurgerKingSetup();

  return new BaseParser(
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
      restaurantIndex: startIndex
    }
  );
}

/**
 * Вычисляет оптимальное количество инстансов на основе количества ресторанов
 */
function calculateOptimalInstances(totalRestaurants: number): number {
  // Базовое правило: 1 инстанс на 3-5 ресторанов, но не более 5 инстансов
  const instances = Math.min(
    Math.max(Math.ceil(totalRestaurants / 4), 1),
    5
  );
  return instances;
}

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('ШАГ 1: Подсчет открытых ресторанов');
    console.log('='.repeat(80));
    
    // Сначала подсчитываем количество открытых ресторанов
    const { count: totalRestaurants } = await countOpenRestaurants(URL, true);
    
    if (totalRestaurants === 0) {
      console.error('Открытых ресторанов не найдено!');
      process.exit(1);
    }
    
    console.log(`\nНайдено открытых ресторанов: ${totalRestaurants}`);
    
    // Вычисляем оптимальное количество инстансов
    const parallelInstances = calculateOptimalInstances(totalRestaurants);
    console.log(`Рекомендуемое количество инстансов: ${parallelInstances}`);
    
    // Можно переопределить через переменную окружения
    const instances = process.env.PARALLEL_INSTANCES 
      ? parseInt(process.env.PARALLEL_INSTANCES, 10)
      : parallelInstances;
    
    console.log(`Используется инстансов: ${instances}`);
    console.log('='.repeat(80) + '\n');

    // Конфигурация параллельного парсинга на основе реального количества
    const coordinator = new ParserCoordinator({
      totalRestaurants,
      parallelInstances: instances,
      startIndex: 0
    });

    console.log('\n' + '='.repeat(80));
    console.log('ШАГ 2: Параллельный парсинг');
    console.log('='.repeat(80) + '\n');

    // Запускаем параллельный парсинг
    const { results, processedIndices, errors } = await coordinator.runParallel(createParser);

    // Выводим статистику
    console.log('\n' + '='.repeat(80));
    console.log('СТАТИСТИКА');
    console.log('='.repeat(80));
    console.log(`Обработано ресторанов: ${processedIndices.length}`);
    console.log(`Обработанные индексы: ${processedIndices.join(', ')}`);
    console.log(`Всего найдено блюд: ${results.reduce((sum, r) => sum + r.dishes.length, 0)}`);
    console.log(`Ошибок: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nОшибки:');
      errors.forEach(({ index, error }) => {
        console.log(`  Ресторан ${index}: ${error.message}`);
      });
    }

    // Объединяем все результаты
    const combinedResult = coordinator.combineResults();

    // Экспортируем объединенный результат
    const parser = createParser(0); // Создаем парсер только для экспорта
    await parser.export(combinedResult, 'dishes_all_parallel.csv');
    console.log('\nРезультаты сохранены в dishes_all_parallel.csv');

    // Также можно экспортировать каждый ресторан отдельно
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const address = result.context.restaurantInfo?.address || `restaurant_${processedIndices[i]}`;
      const safeAddress = address.replace(/[^a-zA-Z0-9]/g, '_');
      await parser.export(result, `dishes_${safeAddress}.csv`);
    }
    console.log('Результаты по каждому ресторану сохранены в отдельные файлы');

  } catch (error) {
    console.error('Ошибка:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);

