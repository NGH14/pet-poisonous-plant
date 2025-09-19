import { createHttpClient } from './services/http.service';
import { scrapeAll } from './services/scraper.service';
import { initializeCSV, generateTimestampedFilename } from './services/export.service';
import { DEFAULT_CONFIG, ASPCA_URLS } from './config/scraper.config';
import { createLogger } from './utils/logger.util';

const logger = createLogger('DraftScraper');

export const DraftScraper = async () => {
  const config = DEFAULT_CONFIG;
  const client = createHttpClient(config);

  const jsonlFilename = generateTimestampedFilename('aspca_plants_draft', 'jsonl');
  const csvFilename = generateTimestampedFilename('aspca_plants_draft', 'csv');

  await initializeCSV(csvFilename);

  const urlsToScrape = {
    Dogs: ASPCA_URLS.DOGS_TOXIC,
  };

  logger.info('Starting ASPCA plant scraping for 5 plants...');

  const { errors } = await scrapeAll(client, urlsToScrape, config,csvFilename,jsonlFilename, 5);

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
  DraftScraper();
}
