export const MAX_PASSWORD_LENGTH = 72;
export const MAX_NAME_LENGTH = 120;

export function sanitizePassword(value: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping controls is the purpose
  return value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, MAX_PASSWORD_LENGTH);
}

export function sanitizeSafeText(value: string, maxLength = MAX_NAME_LENGTH): string {
  return value
    .normalize('NFKC')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping controls is the purpose
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // biome-ignore lint/suspicious/noMisleadingCharacterClass: pictographs have no combining form here
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/[^\p{L}\p{M}\p{N} .,'_-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

export function cpfMask(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);

  if (cleaned.length <= 3) {
    return cleaned;
  }

  if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  }

  if (cleaned.length <= 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  }

  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

