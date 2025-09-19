import { CheerioAPI } from 'cheerio';
import { PlantInfo, PlantLink } from '../types/plant.types';
import { sanitizeText } from '../utils/validation.util';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('PlantDetailParser');

export const extractPlantDetails = (
  $: CheerioAPI,
  plantLink: PlantLink,
  baseUrl: string
): PlantInfo | null => {
  try {
    const name = sanitizeText($('h1').first().text());
    if (!name) {
      logger.warn(`No plant name found for ${plantLink.url}`);
      return null;
    }

    const toxicityRaw = extractFieldArray($, '.field-name-field-toxicity .values');
    const toxicity = toxicityRaw.map(t => t.replace('Toxic to ', ''));
    const isToxicToPets = toxicity.some(t => t.includes('Dogs') || t.includes('Cats'));

    if (!isToxicToPets) {
      return null;
    }

    const toxicPrinciples = extractFieldText($, '.field-name-field-toxic-principles .values');
    const clinicalSigns = extractFieldText($, '.field-name-field-clinical-signs .values');
    
    // First, try the specific selector for the plant image.
    let imageUrl = extractImageUrl($, '.field-name-field-image img', baseUrl);

    // If that fails, fall back to the first image in the main content area.
    if (!imageUrl) {
      imageUrl = extractImageUrl($, '.l-content img', baseUrl);
    }

    return {
      name,
      commonNames: plantLink.commonNames,
      scientificName: plantLink.scientificName,
      family: plantLink.family,
      toxicity: toxicity.filter(t => t === 'Dogs' || t === 'Cats'),
      toxicPrinciples,
      clinicalSigns,
      url: plantLink.url,
      imageUrl,
    };
  } catch (error) {
    logger.error(`Error extracting plant details from ${plantLink.url}:`, error);
    return null;
  }
};

const extractFieldText = ($: CheerioAPI, selector: string): string => {
  return sanitizeText($(selector).text());
};

const extractFieldArray = ($: CheerioAPI, selector: string): string[] => {
  const items: string[] = [];
  $(selector).each((_, element) => {
    const text = sanitizeText($(element).text());
    if (text) {
      items.push(...text.split(',').map(item => sanitizeText(item)).filter(Boolean));
    }
  });
  return items;
};

export const extractImageUrl = ($: CheerioAPI, selector: string, baseUrl: string): string | undefined => {
  const imgElement = $(selector).first();
  if (imgElement.length === 0) return undefined;

  const srcset = imgElement.attr('srcset');
  if (srcset) {
    const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
    const bestSource = sources.pop(); // Get the last (highest res) source
    if (bestSource && !bestSource.includes('imageunavailable')) {
      return bestSource.startsWith('http') ? bestSource : `${baseUrl}${bestSource}`;
    }
  }

  let src = imgElement.attr('data-echo') || imgElement.attr('data-src') || imgElement.attr('src');
  if (src && !src.includes('image_placeholder.gif') && !src.includes('imageunavailable')) {
    return src.startsWith('http') ? src : `${baseUrl}${src}`;
  }

  return undefined;
};
