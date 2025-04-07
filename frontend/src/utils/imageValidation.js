export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp'
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateImage = (file) => {
  if (!file) return { isValid: false, error: 'No file provided' };

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload an image file.' };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { isValid: false, error: 'File too large. Maximum size is 5MB.' };
  }

  return { isValid: true };
};

