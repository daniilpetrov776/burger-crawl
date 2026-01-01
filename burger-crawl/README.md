# Burger King Parser

Парсер для сайта https://burgerkingrus.ru/, который извлекает список товаров по атрибуту `data-dish`.

## Возможности

- Парсинг сайта Burger King и извлечение товаров с атрибутом `data-dish`
- Отображение результатов в React приложении
- Сохранение результатов в JSON файл (Node.js скрипт)

## Установка

```bash
npm install
```

## Использование

### 1. Запуск React приложения

Запустите приложение для просмотра результатов в браузере:

```bash
npm run dev
```

Приложение автоматически загрузит и отобразит все товары с атрибутом `data-dish`.

### 2. Запуск Node.js скрипта

Для запуска парсера как отдельного скрипта (результаты сохранятся в `dishes.json`):

```bash
npm run parse
```

или напрямую:

```bash
node parse.js
```

## Структура проекта

- `src/parseBurgerKing.ts` - Node.js версия парсера (использует cheerio)
- `src/parseBurgerKingBrowser.ts` - браузерная версия парсера (использует DOMParser)
- `parse.js` - Node.js скрипт для запуска парсера из командной строки
- `src/App.tsx` - React компонент для отображения результатов

## Формат данных

Каждый товар содержит следующие поля:

```typescript
interface Dish {
  dataDish: string;      // Значение атрибута data-dish
  name?: string;         // Название товара
  price?: string;        // Цена
  description?: string;  // Описание
  image?: string;       // URL изображения
}
```

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
