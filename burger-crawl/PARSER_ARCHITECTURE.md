# Архитектура парсера

## ✅ Что реализовано

### 1. Базовая архитектура с DI
- **BaseParser** - основной класс с поддержкой Dependency Injection
- Интерфейсы для всех компонентов (IPageParser, IMiddleware, IExporter, IGeocoder, IAddressSelector, IGrouper)
- Типы данных (Dish, ParseResult, ParseContext, Coordinates)

### 2. Компоненты

#### Парсеры страниц
- `BurgerKingPageParser` - парсинг страницы Burger King

#### Middleware
- `GeocodingMiddleware` - автоматический геокодинг адресов

#### Геокодеры
- `NominatimGeocoder` - геокодинг через OpenStreetMap (бесплатно, без ключа)

#### Экспортеры
- `CSVExporter` - экспорт в CSV с поддержкой кириллицы

#### Селекторы адресов
- `SimpleAddressSelector` - извлечение адреса со страницы

#### Группировщики
- `AddressGrouper` - группировка по адресам

## 🚀 Использование

### Базовый пример
```typescript
import {
  BaseParser,
  BurgerKingPageParser,
  CSVExporter
} from './src/parser/index.js';

const parser = new BaseParser(
  { url: 'https://burgerkingrus.ru/' },
  new BurgerKingPageParser(),
  { exporter: new CSVExporter() }
);

const result = await parser.parse();
await parser.export(result, 'dishes.csv');
```

### С геокодингом
```typescript
const geocoder = new NominatimGeocoder(1000);
const geocodingMiddleware = new GeocodingMiddleware(geocoder);

const parser = new BaseParser(
  { url: 'https://burgerkingrus.ru/' },
  new BurgerKingPageParser(),
  {
    middlewares: [geocodingMiddleware],
    exporter: new CSVExporter()
  }
);
```

## 📁 Структура

```
src/parser/
├── types.ts              # Типы данных
├── interfaces.ts         # Интерфейсы для DI
├── BaseParser.ts        # Базовый класс
├── parsers/             # Парсеры страниц
├── middleware/          # Middleware
├── geocoders/           # Геокодеры
├── exporters/           # Экспортеры
├── groupers/            # Группировщики
└── selectors/           # Селекторы адресов
```

## 🔧 Запуск

```bash
# TypeScript (рекомендуется)
npm run parse:ts

# Компиляция и запуск
npm run parse:build
```

## 🎯 Преимущества архитектуры

1. **Расширяемость** - легко добавлять новые middleware, экспортеры, геокодеры
2. **Тестируемость** - каждый компонент можно тестировать отдельно
3. **Гибкость** - можно комбинировать компоненты как угодно
4. **Типобезопасность** - полная поддержка TypeScript

## 📝 Примеры расширения

### Добавить новый экспортер (JSON)
```typescript
export class JSONExporter implements IExporter {
  getFileExtension() { return 'json'; }
  async export(result, filePath) {
    await writeFile(filePath, JSON.stringify(result, null, 2));
  }
}
```

### Добавить middleware для фильтрации
```typescript
export class PriceFilterMiddleware implements IMiddleware {
  async process(result) {
    result.dishes = result.dishes.filter(d => parseFloat(d.price) > 100);
    return result;
  }
}
```

