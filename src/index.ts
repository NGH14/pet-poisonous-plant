import { createHttpClient } from './services/http.service';
import { scrapeAll, scrapePlantDetails } from './services/scraper.service';
import { initializeCSV, generateFilename } from './services/export.service';
import { DEFAULT_CONFIG, ASPCA_URLS } from './config/scraper.config';
import { createLogger } from './utils/logger.util';
import { isProduction } from './config/env.config';

const logger = createLogger('Main');

export const runScraper = async () => {
  const config = DEFAULT_CONFIG;
  const client = createHttpClient(config);

  const prefix = isProduction ? 'poisonousPlant' : 'aspca_plants';

  const jsonlFilename = generateFilename(prefix, 'jsonl');
  const csvFilename = generateFilename(prefix, 'csv');

  await initializeCSV(csvFilename);

  const urlsToScrape = {
    Dogs: ASPCA_URLS.DOGS_TOXIC,
    Cats: ASPCA_URLS.CATS_TOXIC,
  };

  logger.info('Starting ASPCA plant scraping for dogs and cats...');

  const { errors } = await scrapeAll(client, urlsToScrape, config, csvFilename, jsonlFilename,);

  logger.info('--------------------------------------------------');
  logger.info('Scraping finished!');
  logger.info(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    logger.warn('Errors occurred during scraping:');
    errors.forEach(err => logger.warn(`- ${err}`));
  }
  logger.info(`Results saved to ${csvFilename} and ${jsonlFilename}`);
  logger.info('--------------------------------------------------');
};


if (require.main === module) {
  runScraper();
}
