export interface ScrapingConfig {
  delayRange: [number, number];
  maxRetries: number;
  concurrency: number;
  timeout: number;
  delayBetweenBatches: number;
}
