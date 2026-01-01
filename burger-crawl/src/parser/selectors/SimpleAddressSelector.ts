/**
 * Простой селектор адреса - извлекает адрес со страницы
 */

import type { Page } from 'puppeteer';
import type { IAddressSelector } from '../interfaces.js';

export class SimpleAddressSelector implements IAddressSelector {
  async selectAddress(page: Page, targetAddress?: string): Promise<string | null> {
    // Если адрес передан, можно попытаться его выбрать
    // Для Burger King может потребоваться более сложная логика
    if (targetAddress) {
      console.log(`Попытка выбрать адрес: ${targetAddress}`);
      // Здесь можно добавить логику клика по элементам
      // Пока просто возвращаем переданный адрес
      return targetAddress;
    }
    
    return this.extractAddress(page);
  }

  async extractAddress(page: Page): Promise<string | null> {
    try {
      const address = await page.evaluate(() => {
        // Ищем различные варианты отображения адреса
        const addressSelectors = [
          '[class*="address"]',
          '[class*="location"]',
          '[class*="restaurant"]',
          '[data-address]',
          '.restaurant-address',
          '.location-address'
        ];
        
        for (const selector of addressSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            return element.textContent.trim();
          }
        }
        
        // Проверяем мета-теги
        const metaAddress = document.querySelector('meta[property="og:restaurant:address"]');
        if (metaAddress) {
          return metaAddress.getAttribute('content');
        }
        
        return null;
      });
      
      return address;
    } catch (error) {
      console.error('Ошибка при извлечении адреса:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }
}

