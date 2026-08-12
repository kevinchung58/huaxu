export const isFilled = (value?: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.toUpperCase() !== 'N/A';
};

export const filled = <T extends object>(items: T[], keys: (keyof T)[]): T[] =>
  items.filter((item) =>
    keys.some((key) => typeof item[key] === 'string' && isFilled(item[key] as string))
  );
