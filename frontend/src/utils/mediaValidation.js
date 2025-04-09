export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/ogg'
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

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

export const validateVideo = (file) => {
  if (!file) return { isValid: false, error: 'No file provided' };

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a video in MP4, MOV, AVI, WebM, or OGG format.'
    };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      isValid: false,
      error: 'Video file is too large (max 10MB)'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

