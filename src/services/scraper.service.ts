import { AxiosInstance } from 'axios';
import { PlantInfo, PlantLink, } from '../types/plant.types';
import { ScrapingConfig } from '../types/scrape.types';
import { fetchPageWithRetry } from './http.service';
import { extractPlantLinks } from '../parsers/plant-list.parser';
import { extractPlantDetails, extractImageUrl } from '../parsers/plant-detail.parser';
import { delay } from '../utils/delay.util';
import { createLogger } from '../utils/logger.util';
import { appendToCSV, appendToJSONL } from './export.service';

const logger = createLogger('ScraperService');

type PlantLinkWithToxicity = Omit<PlantLink, 'toxicity'> & { toxicity: string[] };

export const scrapeAll = async (
  client: AxiosInstance,
  urls: Record<string, string>,
  config: ScrapingConfig,
  csvFilename: string,
  jsonlFilename: string
): Promise<{ errors: string[] }> => {
  const errors: string[] = [];
  const plantLinkMap = new Map<string, PlantLinkWithToxicity>();

  for (const [animal, url] of Object.entries(urls)) {
    logger.info(`Scraping plant list for ${animal} from: ${url}`);
    const $ = await fetchPageWithRetry(client, url, config);
    if ($) {
      console.log($.html());
    }
    if (!$) {
      errors.push(`Failed to fetch plant list for ${animal}`);
      continue;
    }

    const baseUrl = new URL(url).origin;
    const plantLinks = extractPlantLinks($, baseUrl);

    for (const plantLink of plantLinks) {
      const key = `${plantLink.name}|${plantLink.scientificName}`;
      const existing = plantLinkMap.get(key);
      if (existing) {
        existing.toxicity.push(animal);
      } else {
        plantLinkMap.set(key, { ...plantLink, toxicity: [animal] });
      }
    }
  }

  const allPlantLinks = Array.from(plantLinkMap.values());
  logger.info(`Found ${allPlantLinks.length} unique plants to scrape.`);

  return scrapePlantDetails(client, allPlantLinks, config, csvFilename, jsonlFilename);
};

export const scrapePlantDetails = async (
  client: AxiosInstance,
  plantLinks: PlantLink[],
  config: ScrapingConfig,
  csvFilename: string,
  jsonlFilename: string
): Promise<{ errors: string[] }> => {
  const errors: string[] = [];
  const batches = createBatches(plantLinks, config.concurrency);
  let savedCount = 0;

  logger.info(`Processing ${plantLinks.length} plants in ${batches.length} batches for review`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`);

    const batchPromises = batch.map(async (plantLink) => {
      logger.info(`--- Reviewing: ${plantLink.name} ---`);
      const $ = await fetchPageWithRetry(client, plantLink.url, config);
      if ($) {
        const baseUrl = new URL(plantLink.url).origin;
        const plant = extractPlantDetails($, plantLink, baseUrl);

        if (plant) {
          await appendToCSV(plant, csvFilename);
          await appendToJSONL(plant, jsonlFilename);
          return true;
        }
      }
      errors.push(`Failed to fetch or process: ${plantLink.url}`);
      return false;
    });

    const batchResults = await Promise.all(batchPromises);
    const validCount = batchResults.filter(Boolean).length;
    savedCount += validCount;

    logger.info(`Batch ${batchIndex + 1} completed. Saved: ${validCount}/${batch.length}`);

    if (batchIndex < batches.length - 1) {
      await delay(2000, 5000);
    }
  }

  logger.info(`Finished processing all batches. Total plants saved: ${savedCount}`);
  return { errors };
};

const createBatches = <T>(items: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
};