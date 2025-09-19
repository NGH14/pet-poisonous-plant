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
  const cleanedText = text.replace(/including:/g, '');
  return cleanedText.split(',').map(name => sanitizeText(name)).filter(Boolean);
};
