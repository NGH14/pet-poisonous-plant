import { AxiosInstance } from 'axios';
import { PlantInfo, PlantLink, } from '../types/plant.types';
import { ScrapingConfig } from '../types/scrape.types';
import { fetchPageWithRetry } from './http.service';
import { extractPlantLinks } from '../parsers/plant-list.parser';
import { extractPlantDetails, extractImageUrl } from '../parsers/plant-detail.parser';
import { delay } from '../utils/delay.util';
import { createLogger } from '../utils/logger.util';
import { appendToCSV, writeToJSON } from './export.service';

const logger = createLogger('ScraperService');

type PlantLinkWithToxicity = Omit<PlantLink, 'toxicity'> & { toxicity: string[] };

export const scrapeAll = async (
  client: AxiosInstance,
  urls: Record<string, string>,
  config: ScrapingConfig,
  csvFilename: string,
  jsonFilename: string,
  limit?: number
): Promise<{ errors: string[] }> => {
  const plantLinkMap = new Map<string, PlantLinkWithToxicity>();

  for (const [animal, url] of Object.entries(urls)) {
    logger.info(`Scraping plant list for ${animal} from: ${url}`);
    const $ = await fetchPageWithRetry(client, url, config);
    if (!$) {
      // errors.push(`Failed to fetch plant list for ${animal}`);
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

  let allPlantLinks = Array.from(plantLinkMap.values());
  logger.info(`Found ${allPlantLinks.length} unique plants to scrape.`);

  if (limit) {
    allPlantLinks = allPlantLinks.slice(0, limit);
    logger.info(`Limiting to ${limit} plants for this run.`);
  }

  const { plants, errors } = await scrapePlantDetails(client, allPlantLinks, config, csvFilename);

  await writeToJSON(plants, jsonFilename);

  return { errors };
};

export const scrapePlantDetails = async (
  client: AxiosInstance,
  plantLinks: PlantLink[],
  config: ScrapingConfig,
  csvFilename: string
): Promise<{ plants: PlantInfo[], errors: string[] }> => {
  const errors: string[] = [];
  const plants: PlantInfo[] = [];
  const batches = createBatches(plantLinks, config.concurrency);

  logger.info(`Processing ${plantLinks.length} plants in ${batches.length} batches.`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`);

    const batchPromises = batch.map(async (plantLink) => {
      try {
        const $ = await fetchPageWithRetry(client, plantLink.url, config);
        if ($) {
          const baseUrl = new URL(plantLink.url).origin;
          const plant = extractPlantDetails($, plantLink, baseUrl);

          if (plant) {
            await appendToCSV(plant, csvFilename);
            return plant;
          }
        }
        errors.push(`Failed to fetch or process: ${plantLink.url}`);
        return null;
      } catch (error) {
        logger.error(`Error processing ${plantLink.url}:`, error);
        errors.push(`Failed to process: ${plantLink.url}`);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validPlants = batchResults.filter((p): p is PlantInfo => p !== null);
    plants.push(...validPlants);

    logger.info(`Batch ${batchIndex + 1} completed. Saved: ${validPlants.length}/${batch.length}`);

    if (batchIndex < batches.length - 1) {
      await delay(config.delayBetweenBatches, config.delayBetweenBatches + 2000);
    }
  }

  logger.info(`Finished processing all batches. Total plants saved: ${plants.length}`);
  return { plants, errors };
};

const createBatches = <T>(items: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
};