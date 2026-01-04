# Setup модуль

Setup модуль выполняет последовательность действий перед парсингом страницы для выбора ресторана.

## BurgerKingSetup

Реализует последовательность кликов для выбора ресторана на сайте Burger King:

1. Клик на `.bk-order-point-info__info`
2. Клик на `.bk-order-type__restaurant`
3. Клик на `.bk-restaurants__filter-button`
4. Клик на `.bk-restaurant-filter` с текстом "Открыто сейчас"
5. Клик на `.bk-restaurant-filters-block__show-btn`
6. Выбор ресторана из списка `.bk-restaurant-card` (только открытые)

### Использование

```typescript
import { BaseParser, BurgerKingSetup, BurgerKingPageParser, CSVExporter } from './parser/index.js';

const setup = new BurgerKingSetup();
const parser = new BaseParser(
  { url: 'https://burgerkingrus.ru/' },
  new BurgerKingPageParser(),
  {
    setup: setup,
    restaurantIndex: 0 // Начинаем с первого ресторана
  }
);

// Парсинг первого ресторана (индекс 0)
const result1 = await parser.parse();

// Парсинг второго ресторана (индекс автоматически увеличится до 1)
const result2 = await parser.parse();

// Или установить индекс вручную
parser.setRestaurantIndex(2);
const result3 = await parser.parse();
```

### Парсинг нескольких ресторанов

```typescript
// Парсит 3 ресторана подряд (индексы 0, 1, 2)
const results = await parser.parseMultipleRestaurants(3);
```

### Индекс ресторана

- Индекс начинается с 0 (первый открытый ресторан)
- При каждом вызове `parse()` индекс автоматически увеличивается
- Можно установить индекс вручную через `parser.setRestaurantIndex(index)`
- Можно получить текущий индекс через `parser.getRestaurantIndex()`

### Возвращаемые данные

Setup возвращает информацию о выбранном ресторане:
- `address` - адрес ресторана (если найден)
- `restaurantId` - ID ресторана (если найден)

Эта информация автоматически добавляется в `context.restaurantInfo`.

