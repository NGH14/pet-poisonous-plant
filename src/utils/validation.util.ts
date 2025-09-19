export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ').replace(/"/g, '""');
};

export const parseCommonNames = (text: string): string[] => {
  const match = text.match(/\(([^)]+)\)/);
  return match ? 
    match[1].split(',').map(name => sanitizeText(name)).filter(Boolean) : 
    [];
};
