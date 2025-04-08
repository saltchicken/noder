export const validateVideo = (file: File) => {
  if (!file.type.startsWith('video/')) {
    return {
      isValid: false,
      error: 'Please upload a valid video file'
    };
  }

  // Optional: Add size validation
  const MAX_SIZE = 10 * 1024 * 1024; // 100MB
  if (file.size > MAX_SIZE) {
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

