import { ScrapingConfig } from '../types/scrape.types';

export const DEFAULT_CONFIG: ScrapingConfig = {
  delayRange: [3000, 7000],
  maxRetries: 5,
  concurrency: 2,
  timeout: 10000,
  delayBetweenBatches: 2000,
};

export const ASPCA_URLS = {
  DOGS_TOXIC: 'https://www.aspca.org/pet-care/animal-poison-control/dogs-plant-list',
  CATS_TOXIC: 'https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list',
} as const;

export const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
} as const;
