/**
 * Базовый класс парсера с поддержкой DI
 */

import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import type {
  ParseResult,
  ParseContext,
  ParserConfig
} from './types.js';
import type {
  IMiddleware,
  IExporter,
  IAddressSelector,
  IPageParser,
  ISetup
} from './interfaces.js';

export class BaseParser {
  private config: ParserConfig;
  private middlewares: IMiddleware[] = [];
  private exporter?: IExporter;
  private addressSelector?: IAddressSelector;
  private pageParser: IPageParser;
  private setup?: ISetup;
  private restaurantIndex: number = 0; // Индекс текущего ресторана

  constructor(
    config: ParserConfig,
    pageParser: IPageParser,
    options?: {
      middlewares?: IMiddleware[];
      exporter?: IExporter;
      addressSelector?: IAddressSelector;
      setup?: ISetup;
      restaurantIndex?: number; // Начальный индекс ресторана
    }
  ) {
    this.config = {
      headless: true,
      timeout: 30000,
      waitForSelector: '[data-dish]',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...config
    };
    
    this.pageParser = pageParser;
    this.middlewares = options?.middlewares || [];
    this.exporter = options?.exporter;
    this.addressSelector = options?.addressSelector;
    this.setup = options?.setup;
    this.restaurantIndex = options?.restaurantIndex || 0;
    
    // Сортируем middleware по порядку
    this.middlewares.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Добавляет middleware
   */
  addMiddleware(middleware: IMiddleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Устанавливает экспортер
   */
  setExporter(exporter: IExporter): void {
    this.exporter = exporter;
  }

  /**
   * Устанавливает селектор адреса
   */
  setAddressSelector(selector: IAddressSelector): void {
    this.addressSelector = selector;
  }

  /**
   * Устанавливает setup операции
   */
  setSetup(setup: ISetup): void {
    this.setup = setup;
  }

  /**
   * Устанавливает индекс ресторана для следующего парсинга
   */
  setRestaurantIndex(index: number): void {
    this.restaurantIndex = index;
  }

  /**
   * Получает текущий индекс ресторана
   */
  getRestaurantIndex(): number {
    return this.restaurantIndex;
  }


  /**
   * Основной метод парсинга
   */
  async parse(targetAddress?: string): Promise<ParseResult> {
    let browser: Browser | null = null;
    
    try {
      console.log('Запускаю браузер...');
      
      browser = await puppeteer.launch({
        headless: this.config.headless,
        args: this.config.browserArgs
      });
      
      const page = await browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      
      console.log('Загружаю страницу...');
      await page.goto(this.config.url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout
      });
      
      // Создаем контекст парсинга
      const context: ParseContext = {
        url: this.config.url,
        restaurantInfo: {}
      };
      
      // Выполняем setup операции, если они заданы
      if (this.setup) {
        console.log(`Выполняю setup операции с индексом ресторана: ${this.restaurantIndex}`);
        const setupResult = await this.setup.execute(page, this.restaurantIndex);
        
        if (!context.restaurantInfo) {
          context.restaurantInfo = {};
        }
        
        if (setupResult.address) {
          context.restaurantInfo.address = setupResult.address;
        }
        if (setupResult.restaurantId) {
          context.restaurantInfo.restaurantId = setupResult.restaurantId;
        }
        
        // Увеличиваем индекс для следующего запуска
        this.restaurantIndex++;
      } else if (this.addressSelector && targetAddress) {
        // Старый способ выбора адреса (если setup не используется)
        console.log(`Выбираю адрес: ${targetAddress}`);
        const selectedAddress = await this.addressSelector.selectAddress(page, targetAddress);
        if (selectedAddress) {
          context.restaurantInfo = {
            ...context.restaurantInfo,
            address: selectedAddress
          };
        }
      } else if (this.addressSelector) {
        // Извлекаем адрес со страницы
        const extractedAddress = await this.addressSelector.extractAddress(page);
        if (extractedAddress) {
          context.restaurantInfo = {
            ...context.restaurantInfo,
            address: extractedAddress
          };
        }
      }
      
      // Ждем загрузки контента
      console.log('Ожидаю загрузки контента...');
      if (this.config.waitForSelector) {
        try {
          await page.waitForSelector(this.config.waitForSelector, { timeout: 15000 });
        } catch (e) {
          console.log(`Селектор ${this.config.waitForSelector} не найден...`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Парсим страницу
      console.log('Парсинг страницы...');
      const dishes = await this.pageParser.parse(page, context);
      
      console.log(`Найдено товаров: ${dishes.length}`);
      
      // Создаем результат
      let result: ParseResult = {
        dishes,
        context
      };
      
      // Применяем middleware
      for (const middleware of this.middlewares) {
        console.log(`Применяю middleware: ${middleware.constructor.name}`);
        result = await middleware.process(result);
      }
      
      return result;
      
    } catch (error) {
      console.error('Ошибка при парсинге:', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Парсит несколько адресов
   */
  async parseMultiple(targetAddresses: string[]): Promise<ParseResult[]> {
    const results: ParseResult[] = [];
    
    for (let i = 0; i < targetAddresses.length; i++) {
      const address = targetAddresses[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Парсинг адреса ${i + 1}/${targetAddresses.length}: ${address}`);
      console.log('='.repeat(80));
      
      try {
        const result = await this.parse(address);
        results.push(result);
        
        // Задержка между запросами
        if (i < targetAddresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Ошибка для адреса ${address}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return results;
  }

  /**
   * Парсит несколько ресторанов используя setup (автоматически увеличивает индекс)
   */
  async parseMultipleRestaurants(count: number): Promise<ParseResult[]> {
    if (!this.setup) {
      throw new Error('Setup не установлен. Используйте setSetup() перед вызовом этого метода.');
    }

    const results: ParseResult[] = [];
    const initialIndex = this.restaurantIndex;

    for (let i = 0; i < count; i++) {
      this.restaurantIndex = initialIndex + i;
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Парсинг ресторана ${i + 1}/${count} (индекс: ${this.restaurantIndex})`);
      console.log('='.repeat(80));

      try {
        const result = await this.parse();
        results.push(result);

        // Задержка между запросами
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Ошибка для ресторана с индексом ${this.restaurantIndex}:`, error instanceof Error ? error.message : String(error));
        // Продолжаем со следующим рестораном
      }
    }

    return results;
  }

  /**
   * Экспортирует результат
   */
  async export(result: ParseResult, filePath: string): Promise<void> {
    if (!this.exporter) {
      throw new Error('Экспортер не установлен');
    }
    
    await this.exporter.export(result, filePath);
  }

  /**
   * Экспортирует несколько результатов
   */
  async exportMultiple(results: ParseResult[], basePath: string): Promise<void> {
    if (!this.exporter) {
      throw new Error('Экспортер не установлен');
    }
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const address = result.context.restaurantInfo?.address || `restaurant_${i + 1}`;
      const safeAddress = address.replace(/[^a-zA-Z0-9]/g, '_');
      const filePath = `${basePath}_${safeAddress}.${this.exporter.getFileExtension()}`;
      
      await this.exporter.export(result, filePath);
    }
  }
}

