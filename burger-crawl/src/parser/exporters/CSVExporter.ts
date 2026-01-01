/**
 * Экспортер в CSV формат
 */

import { writeFile } from 'fs/promises';
import type { IExporter } from '../interfaces.js';
import type { ParseResult, Dish } from '../types.js';

export class CSVExporter implements IExporter {
  private headers: string[];

  constructor(headers?: string[]) {
    // Если заголовки не указаны, используем стандартные
    this.headers = headers || ['data-dish', 'Название', 'Цена', 'Изображение', 'Адрес', 'Широта', 'Долгота'];
  }

  getFileExtension(): string {
    return 'csv';
  }

  private escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Если значение содержит запятую, кавычку или перенос строки, оборачиваем в кавычки
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private getDishValue(dish: Dish, header: string): string {
    // Маппинг заголовков на поля блюда
    const mapping: Record<string, keyof Dish> = {
      'data-dish': 'dataDish',
      'Название': 'name',
      'Цена': 'price',
      'Изображение': 'image',
      'Адрес': 'address',
      'Широта': 'latitude',
      'Долгота': 'longitude'
    };
    
    const field = mapping[header] || header;
    const value = dish[field];
    
    // Обработка вложенных объектов (например, coordinates)
    if (typeof value === 'object' && value !== null) {
      if ('latitude' in value && 'longitude' in value) {
        return header === 'Широта' ? String(value.latitude) : String(value.longitude);
      }
      return JSON.stringify(value);
    }
    
    return String(value || '');
  }

  async export(result: ParseResult, filePath: string): Promise<void> {
    const address = result.context.restaurantInfo?.address || 'Не указан';
    
    // Добавляем адрес к каждому блюду, если его нет
    const dishesWithAddress: Dish[] = result.dishes.map(dish => ({
      ...dish,
      address: dish.address || address,
      latitude: dish.latitude || result.context.restaurantInfo?.coordinates?.latitude,
      longitude: dish.longitude || result.context.restaurantInfo?.coordinates?.longitude
    }));
    
    // Создаем строку заголовков
    const headerRow = this.headers.map(h => this.escapeCSV(h)).join(',');
    
    // Создаем строки данных
    const dataRows = dishesWithAddress.map(dish => {
      return this.headers.map(header => {
        const value = this.getDishValue(dish, header);
        return this.escapeCSV(value);
      }).join(',');
    });
    
    // Объединяем заголовки и данные
    const csvData = [headerRow, ...dataRows].join('\n');
    
    // Сохраняем в CSV файл с BOM для правильного отображения кириллицы в Excel
    const csvWithBOM = '\ufeff' + csvData;
    await writeFile(filePath, csvWithBOM, 'utf-8');
    
    console.log(`Результаты сохранены в файл ${filePath}`);
  }
}

