export interface ScrapingResult {
  plants: PlantInfo[];
  metadata: {
    scrapedAt: string;
    totalPlants: number;
    source: string;
    errors: string[];
  };
}

export interface ScrapingConfig {
  delayRange: [number, number];
  maxRetries: number;
  concurrency: number;
  timeout: number;
}
