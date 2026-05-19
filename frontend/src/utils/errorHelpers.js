/**
 * Extracts field-level validation errors from a Laravel 422 response.
 * Returns a flat object: { fieldName: "First error message" }
 */
export const extractErrors = (error) => {
  if (error?.response?.status === 422 && error.response.data?.errors) {
    const raw = error.response.data.errors;
    const flat = {};
    Object.keys(raw).forEach((key) => {
      flat[key] = Array.isArray(raw[key]) ? raw[key][0] : raw[key];
    });
    return flat;
  }
  return {};
};

/**
 * Returns the top-level error message from an API response.
 */
export const extractMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred.'
  );
};
