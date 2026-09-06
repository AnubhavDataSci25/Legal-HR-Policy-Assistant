/**
 * Normalizes API/network failures into friendly, user-facing copy.
 * Never surfaces raw stack traces or Axios error internals to the UI.
 */
export function formatUploadError(err) {
  if (!err?.response) {
    return "The assistant is currently unreachable. Check your connection and try again.";
  }
  return err.response.data?.detail || "We couldn't process that PDF. Please try again.";
}

export function formatQueryError(err) {
  if (!err?.response) {
    return "The assistant is currently unreachable. Check your connection and try again.";
  }
  return err.response.data?.detail || "Something went wrong while getting the answer.";
}