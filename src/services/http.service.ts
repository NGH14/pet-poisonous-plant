import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { ScrapingConfig } from '../types/plant.types';
import { HTTP_HEADERS } from '../config/scraper.config';
import { delay, exponentialBackoff } from '../utils/delay.util';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('HttpService');

export const createHttpClient = (config: ScrapingConfig): AxiosInstance => {
  return axios.create({
    timeout: config.timeout,
    headers: HTTP_HEADERS,
  });
};

export const fetchPageWithRetry = async (
  client: AxiosInstance,
  url: string,
  config: ScrapingConfig
): Promise<CheerioAPI | null> => {
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      await delay(...config.delayRange);
      
      logger.info(`Fetching: ${url} (attempt ${attempt + 1})`);
      const response: AxiosResponse = await client.get(url);
      
      return load(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Attempt ${attempt + 1} failed for ${url}: ${errorMessage}`);
      
      if (attempt === config.maxRetries - 1) {
        logger.error(`Failed to fetch ${url} after ${config.maxRetries} attempts`);
        return null;
      }
      
      const backoffDelay = exponentialBackoff(attempt);
      await delay(backoffDelay, backoffDelay + 1000);
    }
  }
  return null;
};
