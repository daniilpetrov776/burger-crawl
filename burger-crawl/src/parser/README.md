# Универсальный парсер с Dependency Injection

Архитектура парсера построена на принципах Dependency Injection (DI), что позволяет легко расширять функциональность через middleware и плагины.

## Архитектура

### Основные компоненты

1. **BaseParser** - базовый класс парсера с поддержкой DI
2. **IPageParser** - интерфейс для парсинга страницы
3. **IMiddleware** - интерфейс для обработки данных после парсинга
4. **IExporter** - интерфейс для экспорта данных
5. **IGeocoder** - интерфейс для геокодинга адресов
6. **IAddressSelector** - интерфейс для выбора адреса на странице
7. **IGrouper** - интерфейс для группировки данных

## Использование

### Базовый пример

```typescript
import {
  BaseParser,
  BurgerKingPageParser,
  CSVExporter,
  SimpleAddressSelector
} from './parser/index.js';

const parser = new BaseParser(
  {
    url: 'https://burgerkingrus.ru/',
    headless: true,
    waitForSelector: '[data-dish]'
  },
  new BurgerKingPageParser(),
  {
    exporter: new CSVExporter(),
    addressSelector: new SimpleAddressSelector()
  }
);

const result = await parser.parse();
await parser.export(result, 'dishes.csv');
```

### С геокодингом

```typescript
import {
  BaseParser,
  BurgerKingPageParser,
  GeocodingMiddleware,
  NominatimGeocoder,
  CSVExporter
} from './parser/index.js';

const geocoder = new NominatimGeocoder(1000); // Задержка 1 сек
const geocodingMiddleware = new GeocodingMiddleware(geocoder);

const parser = new BaseParser(
  { url: 'https://burgerkingrus.ru/' },
  new BurgerKingPageParser(),
  {
    middlewares: [geocodingMiddleware],
    exporter: new CSVExporter()
  }
);

const result = await parser.parse();
// Координаты автоматически добавятся к каждому блюду
```

### Парсинг нескольких адресов

```typescript
const addresses = [
  'Москва, ул. Тверская, д. 1',
  'Санкт-Петербург, Невский проспект, д. 28'
];

const results = await parser.parseMultiple(addresses);

// Экспортировать все в один файл
const allDishes = results.flatMap(r => r.dishes);
const combinedResult = {
  dishes: allDishes,
  context: { url: URL, restaurantInfo: {} }
};
await parser.export(combinedResult, 'dishes_all.csv');

// Или экспортировать каждый адрес отдельно
await parser.exportMultiple(results, 'dishes');
```

## Создание собственных компонентов

### Создание middleware

```typescript
import type { IMiddleware } from './interfaces.js';
import type { ParseResult } from './types.js';

export class CustomMiddleware implements IMiddleware {
  order = 2; // Порядок выполнения (меньше = раньше)
  
  async process(result: ParseResult): Promise<ParseResult> {
    // Обработка данных
    result.dishes = result.dishes.map(dish => ({
      ...dish,
      customField: 'value'
    }));
    
    return result;
  }
}
```

### Создание экспортера

```typescript
import type { IExporter } from './interfaces.js';
import type { ParseResult } from './types.js';

export class JSONExporter implements IExporter {
  getFileExtension(): string {
    return 'json';
  }
  
  async export(result: ParseResult, filePath: string): Promise<void> {
    const json = JSON.stringify(result, null, 2);
    await writeFile(filePath, json, 'utf-8');
  }
}
```

### Создание геокодера

```typescript
import type { IGeocoder } from './interfaces.js';
import type { Coordinates } from './types.js';

export class YandexGeocoder implements IGeocoder {
  constructor(private apiKey: string) {}
  
  async geocode(address: string): Promise<Coordinates | null> {
    // Реализация геокодинга через Яндекс API
    // ...
  }
}
```

## Группировка данных

```typescript
import { AddressGrouper } from './parser/index.js';

const grouper = new AddressGrouper();
const grouped = await grouper.group(result);

// grouped будет содержать:
// {
//   "Москва, ул. Тверская": [dish1, dish2, ...],
//   "СПб, Невский пр.": [dish3, dish4, ...]
// }
```

## Запуск

```bash
# Запуск TypeScript напрямую (рекомендуется для разработки)
npm run parse:ts

# Компиляция и запуск
npm run parse:build
```

## Структура файлов

```
src/parser/
├── types.ts              # Базовые типы
├── interfaces.ts         # Интерфейсы для DI
├── BaseParser.ts        # Базовый класс парсера
├── parsers/             # Реализации парсеров страниц
│   └── BurgerKingPageParser.ts
├── middleware/          # Middleware для обработки данных
│   └── GeocodingMiddleware.ts
├── geocoders/           # Геокодеры
│   └── NominatimGeocoder.ts
├── exporters/           # Экспортеры
│   └── CSVExporter.ts
├── groupers/            # Группировщики
│   └── AddressGrouper.ts
├── selectors/           # Селекторы адресов
│   └── SimpleAddressSelector.ts
└── index.ts             # Экспорт всех компонентов
```

