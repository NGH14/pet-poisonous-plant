export const delay = (min: number, max?: number): Promise<void> => {
  const delayTime = max ? Math.floor(Math.random() * (max - min + 1)) + min : min;
  return new Promise(resolve => setTimeout(resolve, delayTime));
};

export const exponentialBackoff = (attempt: number, baseDelay = 2000): number => {
  return baseDelay * Math.pow(2, attempt);
};
