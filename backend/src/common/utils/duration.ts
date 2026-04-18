const durationPattern = /^(\d+)([smhd])$/i;

const unitToMs: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export const durationToMilliseconds = (value: string): number => {
  const trimmed = value.trim();
  const matched = durationPattern.exec(trimmed);

  if (!matched) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(matched[1]);
  const unit = matched[2].toLowerCase();

  return amount * unitToMs[unit];
};

export const durationToDateFromNow = (value: string): Date => {
  return new Date(Date.now() + durationToMilliseconds(value));
};
