/**
 * Setup операции для Burger King - выбор ресторана перед парсингом
 */

import type { Page } from 'puppeteer';
import type { ISetup } from '../interfaces.js';

export class BurgerKingSetup implements ISetup {
  private defaultDelay = 500; // Задержка между действиями в мс

  /**
   * Ждет появления элемента и кликает по нему
   */
  private async waitAndClick(
    page: Page,
    selector: string,
    timeout: number = 10000,
    delay: number = this.defaultDelay
  ): Promise<void> {
    try {
      console.log(`Ожидаю элемент: ${selector}`);
      await page.waitForSelector(selector, { timeout });
      await new Promise(resolve => setTimeout(resolve, 300)); // Небольшая задержка перед кликом
      await page.click(selector);
      console.log(`Клик по элементу: ${selector}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Ошибка при клике по ${selector}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Кликает по элементу с определенным текстом
   */
  private async clickByText(
    page: Page,
    selector: string,
    text: string,
    delay: number = this.defaultDelay
  ): Promise<void> {
    try {
      console.log(`Ищу элемент ${selector} с текстом: ${text}`);
      
      const clicked = await page.evaluate((sel, txt) => {
        const elements = Array.from(document.querySelectorAll(sel));
        for (const element of elements) {
          if (element.textContent?.toLowerCase().includes(txt.toLowerCase())) {
            (element as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, selector, text);

      if (!clicked) {
        throw new Error(`Элемент ${selector} с текстом "${text}" не найден`);
      }

      console.log(`Клик по элементу с текстом: ${text}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Ошибка при клике по элементу с текстом "${text}":`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Находит и кликает по ресторану с индексом, который открыт
   */
  private async selectRestaurantByIndex(
    page: Page,
    index: number = 0
  ): Promise<{ address?: string; restaurantId?: string }> {
    try {
      console.log(`Ищу ресторан с индексом ${index} (открытый)`);
      
      const restaurantInfo = await page.evaluate((idx) => {
        const cards = Array.from(document.querySelectorAll('.bk-restaurant-card'));
        const openRestaurants: Array<{ element: Element; address?: string; id?: string }> = [];

        for (const card of cards) {
          const infoElement = card.querySelector('.bk-restaurant-card__info');
          if (infoElement) {
            const text = infoElement.textContent?.toLowerCase() || '';
            if (text.includes('открыт')) {
              // Пытаемся извлечь адрес
              const addressElement = card.querySelector('.bk-restaurant-card__address, .bk-restaurant-card__title');
              const address = addressElement?.textContent?.trim();
              
              // Пытаемся извлечь ID
              const id = card.getAttribute('data-id') || card.getAttribute('data-restaurant-id');
              
              openRestaurants.push({
                element: card,
                address: address || undefined,
                id: id || undefined
              });
            }
          }
        }

        if (idx >= 0 && idx < openRestaurants.length) {
          const selected = openRestaurants[idx];
          (selected.element as HTMLElement).click();
          return {
            address: selected.address,
            restaurantId: selected.id,
            totalFound: openRestaurants.length
          };
        }

        return {
          address: undefined,
          restaurantId: undefined,
          totalFound: openRestaurants.length
        };
      }, index);

      if (!restaurantInfo.address && !restaurantInfo.restaurantId) {
        throw new Error(`Ресторан с индексом ${index} не найден. Найдено открытых ресторанов: ${restaurantInfo.totalFound}`);
      }

      console.log(`Выбран ресторан #${index + 1}: ${restaurantInfo.address || restaurantInfo.restaurantId}`);
      console.log(`Всего найдено открытых ресторанов: ${restaurantInfo.totalFound}`);
      
      await new Promise(resolve => setTimeout(resolve, this.defaultDelay));

      return {
        address: restaurantInfo.address,
        restaurantId: restaurantInfo.restaurantId
      };
    } catch (error) {
      console.error('Ошибка при выборе ресторана:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Выполняет setup до получения списка ресторанов и подсчитывает открытые
   * Не выбирает конкретный ресторан, только открывает список
   */
  async countOpenRestaurants(page: Page): Promise<number> {
    console.log('Начинаю setup для подсчета открытых ресторанов...');

    try {
      // 1. Клик на bk-order-point-info__info
      await this.waitAndClick(page, '.bk-order-point-info__info');

      // 2. Клик на bk-order-type__restaurant
      await this.waitAndClick(page, '.bk-order-type__restaurant');

      // 3. Клик на bk-restaurants__filter-button
      await this.waitAndClick(page, '.bk-restaurants__filter-button');

      // 4. Клик на bk-restaurant-filter с текстом "Открыто сейчас"
      await this.clickByText(page, '.bk-restaurant-filter', 'Открыто сейчас');

      // 5. Клик на bk-restaurant-filters-block__show-btn
      await this.waitAndClick(page, '.bk-restaurant-filters-block__show-btn');

      // 6. Ждем появления списка ресторанов
      console.log('Ожидаю появления списка ресторанов...');
      await page.waitForSelector('.bk-restaurant-card', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 7. Подсчитываем открытые рестораны
      const count = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.bk-restaurant-card'));
        let openCount = 0;

        for (const card of cards) {
          const infoElement = card.querySelector('.bk-restaurant-card__info');
          if (infoElement) {
            const text = infoElement.textContent?.toLowerCase() || '';
            if (text.includes('открыт')) {
              openCount++;
            }
          }
        }

        return openCount;
      });

      console.log(`Найдено открытых ресторанов: ${count}`);
      return count;

    } catch (error) {
      console.error('Ошибка при подсчете ресторанов:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Выполняет последовательность setup операций
   */
  async execute(page: Page, restaurantIndex: number = 0): Promise<{ address?: string; restaurantId?: string }> {
    console.log('Начинаю setup операции для Burger King...');
    console.log(`Индекс ресторана: ${restaurantIndex}`);

    try {
      // 1. Клик на bk-order-point-info__info
      await this.waitAndClick(page, '.bk-order-point-info__info');

      // 2. Клик на bk-order-type__restaurant
      await this.waitAndClick(page, '.bk-order-type__restaurant');

      // 3. Клик на bk-restaurants__filter-button
      await this.waitAndClick(page, '.bk-restaurants__filter-button');

      // 4. Клик на bk-restaurant-filter с текстом "Открыто сейчас"
      await this.clickByText(page, '.bk-restaurant-filter', 'Открыто сейчас');

      // 5. Клик на bk-restaurant-filters-block__show-btn
      await this.waitAndClick(page, '.bk-restaurant-filters-block__show-btn');

      // 6. Ждем появления списка ресторанов
      console.log('Ожидаю появления списка ресторанов...');
      await page.waitForSelector('.bk-restaurant-card', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 7. Выбираем ресторан по индексу
      const restaurantInfo = await this.selectRestaurantByIndex(page, restaurantIndex);

      // 8. Ждем загрузки меню после выбора ресторана
      console.log('Ожидаю загрузки меню...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Setup операции завершены успешно');
      return restaurantInfo;

    } catch (error) {
      console.error('Ошибка при выполнении setup операций:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

