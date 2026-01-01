/**
 * Парсер страницы Burger King
 */

import type { Page } from 'puppeteer';
import type { IPageParser } from '../interfaces.js';
import type { Dish, ParseContext } from '../types.js';

export class BurgerKingPageParser implements IPageParser {
  async parse(page: Page, context: ParseContext): Promise<Dish[]> {
    const dishes = await page.evaluate(() => {
      const results: Dish[] = [];
      
      // Ищем все элементы с атрибутом data-dish
      const elements = document.querySelectorAll('[data-dish]');
      console.log('Найдено элементов с [data-dish]:', elements.length);
      
      elements.forEach((element) => {
        const dataDish = element.getAttribute('data-dish') || '';
        
        const dish: Dish = {
          dataDish: dataDish,
        };
        
        // Пытаемся найти название товара
        const nameElement = element.querySelector('.dish-name, .product-name, h2, h3, h4, [class*="name"]');
        if (nameElement) {
          dish.name = nameElement.textContent?.trim() || '';
        }
        
        // Пытаемся найти цену
        const priceElement = element.querySelector('.price, .dish-price, [class*="price"]');
        if (priceElement) {
          dish.price = priceElement.textContent?.trim() || '';
        }

        // Пытаемся найти изображение
        const imgElement = element.querySelector('img');
        if (imgElement) {
          dish.image = imgElement.getAttribute('src') || imgElement.getAttribute('data-src') || '';
        }
        
        // Если название не найдено, используем текст самого элемента
        if (!dish.name) {
          const text = element.textContent?.trim() || '';
          if (text) {
            dish.name = text.split('\n')[0].trim();
          }
        }
        
        results.push(dish);
      });
      
      return results;
    });
    
    return dishes;
  }
}

