import { CheerioAPI } from 'cheerio';
import { PlantLink } from '../types/plant.types';
import { parseCommonNames, sanitizeText } from '../utils/validation.util';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('PlantListParser');

export const extractPlantLinks = ($: CheerioAPI, baseUrl: string): PlantLink[] => {
  const plants: PlantLink[] = [];

  $('.views-row').each((_, element) => {
    try {
      const $row = $(element);
      const linkElement = $row.find('.views-field-path a').first();
      const name = sanitizeText(linkElement.text());
      const relativeUrl = linkElement.attr('href');

      if (!name || !relativeUrl) return;

      const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : `${baseUrl}${relativeUrl}`;

      const fullText = $row.find('.views-field-path .field-content').text();
      const parts = fullText.split('|');

      let commonNames: string[] = [];
      const commonNamesMatch = parts[0].match(/\((.*?)\)/);
      if (commonNamesMatch && commonNamesMatch[1]) {
        commonNames = parseCommonNames(commonNamesMatch[1]);
      }

      let scientificName = '';
      if (parts.length > 1) {
        scientificName = sanitizeText(parts[1].replace('Scientific Names:', ''));
      }

      let family = '';
      if (parts.length > 2) {
        family = sanitizeText(parts[2].replace('Family:', ''));
      }

      plants.push({
        name,
        url: fullUrl,
        commonNames,
        scientificName,
        family,
      });
    } catch (error) {
      logger.warn('Error parsing plant link:', error);
    }
  });

  logger.info(`Extracted ${plants.length} plant links`);
  return plants;
};
