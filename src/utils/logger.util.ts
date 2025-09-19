export const createLogger = (module: string) => ({
  info: (message: string, ...args: any[]) => 
    console.log(`[${new Date().toISOString()}] [INFO] [${module}] ${message}`, ...args),
  
  warn: (message: string, ...args: any[]) => 
    console.warn(`[${new Date().toISOString()}] [WARN] [${module}] ${message}`, ...args),
  
  error: (message: string, error?: Error | any) => 
    console.error(`[${new Date().toISOString()}] [ERROR] [${module}] ${message}`, error),
  
  debug: (message: string, ...args: any[]) => 
    console.debug(`[${new Date().toISOString()}] [DEBUG] [${module}] ${message}`, ...args),
});
