import * as fs from 'fs/promises';
import { PlantInfo } from '../types/plant.types';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('ExportService');

export const initializeCSV = async (filename: string): Promise<void> => {
  try {
    const headers = [
      'Name', 'Common Names', 'Scientific Name', 'Family',
      'Toxicity', 'Toxic Principles', 'Clinical Signs', 'URL', 'Image URL'
    ].join(',');
    await fs.writeFile(filename, headers + '\n', 'utf8');
    logger.info(`Initialized CSV file: ${filename}`);
  } catch (error) {
    logger.error('Error initializing CSV file:', error);
    throw error;
  }
};

export const appendToCSV = async (
  plant: PlantInfo,
  filename: string
): Promise<void> => {
  try {
    const row = [
      plant.name,
      plant.commonNames.join('; '),
      plant.scientificName,
      plant.family,
      plant.toxicity.join('; '),
      plant.toxicPrinciples,
      plant.clinicalSigns,
      plant.url,
      plant.imageUrl || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');

    await fs.appendFile(filename, row + '\n', 'utf8');
  } catch (error) {
    logger.error(`Error appending to CSV file ${filename}:`, error);
  }
};

export const writeToJSON = async (
  plants: PlantInfo[],
  filename: string
): Promise<void> => {
  try {
    await fs.writeFile(filename, JSON.stringify(plants, null, 2), 'utf8');
    logger.info(`Successfully wrote ${plants.length} plants to ${filename}`);
  } catch (error) {
    logger.error(`Error writing to JSON file ${filename}:`, error);
  }
};

import { isProduction } from '../config/env.config';

export const generateFilename = (prefix: string, extension: string): string => {
  if (isProduction) {
    return `${prefix}.${extension}`;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
};
