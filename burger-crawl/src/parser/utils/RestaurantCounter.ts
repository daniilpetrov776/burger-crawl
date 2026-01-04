/**
 * Утилита для подсчета открытых ресторанов
 */

import puppeteer from 'puppeteer';
import { BurgerKingSetup } from '../setup/BurgerKingSetup.js';

export interface CountRestaurantsResult {
  count: number;
}

/**
 * Подсчитывает количество открытых ресторанов после setup
 */
export async function countOpenRestaurants(
  url: string,
  headless: boolean = true
): Promise<CountRestaurantsResult> {
  let browser;

  try {
    console.log('Запускаю браузер для подсчета ресторанов...');
    
    browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Загружаю страницу...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const setup = new BurgerKingSetup();
    const count = await setup.countOpenRestaurants(page);

    // Закрываем браузер после подсчета
    if (browser) {
      await browser.close();
    }

    return { count };
  } catch (error) {
    console.error('Ошибка при подсчете ресторанов:', error instanceof Error ? error.message : String(error));
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

