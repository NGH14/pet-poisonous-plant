import { createHttpClient } from './services/http.service';
import { scrapeAll } from './services/scraper.service';
import { initializeCSV, generateFilename } from './services/export.service';
import { DEFAULT_CONFIG, ASPCA_URLS } from './config/scraper.config';
import { createLogger } from './utils/logger.util';

const logger = createLogger('DraftScraper');

export const DraftScraper = async () => {
  const config = DEFAULT_CONFIG;
  const client = createHttpClient(config);

  const csvFilename = generateFilename('aspca_plants_draft', 'csv');
  const jsonFilename = generateFilename('aspca_plants_draft', 'json');

  await initializeCSV(csvFilename);

  const urlsToScrape = {
    Dogs: ASPCA_URLS.DOGS_TOXIC,
  };

  logger.info('Starting ASPCA plant scraping for 5 plants...');

  const { errors } = await scrapeAll(client, urlsToScrape, config,csvFilename, jsonFilename, 5);

  logger.info('--------------------------------------------------');
  logger.info('Scraping finished!');
  logger.info(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    logger.warn('Errors occurred during scraping:');
    errors.forEach(err => logger.warn(`- ${err}`));
  }
  logger.info(`Results saved to ${csvFilename} and ${jsonFilename}`);
};


if (require.main === module) {
  DraftScraper();
}
