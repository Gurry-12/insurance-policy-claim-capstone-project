/**
 * @template T
 * @typedef {Object} ApiResponseDTO
 * @property {string} message - User-facing success message
 * @property {boolean} success - Always true for success responses
 * @property {string} timeStamp - ISO timestamp
 * @property {T} data - The typed response object or array
 */

/**
 * @template T
 * @typedef {Object} PageResponseDTO
 * @property {T[]} content - Array of objects
 * @property {number} pageNumber - Current page (0-indexed)
 * @property {number} pageSize - Items per page
 * @property {number} totalRecords - Total items across all pages
 * @property {number} totalPages - Total pages available
 * @property {boolean} lastPage - True if no more pages exist
 * @property {string} sortingType - 'asc' or 'desc'
 */

/**
 * @typedef {Object} ErrorResponseDTO
 * @property {string} message - User-facing error message
 * @property {boolean} success - Always false
 * @property {string} errorType - e.g., BAD_REQUEST, NOT_FOUND, UNAUTHORIZED
 * @property {number} statusCode - HTTP status code
 * @property {string} timeStamp - ISO timestamp
 * @property {string} requestPath - The API endpoint that failed
 */

/**
 * @typedef {Object} ValidationErrorResponseDTO
 * @property {string} message - Validation failed
 * @property {boolean} success - false
 * @property {string} errorType - BAD_REQUEST
 * @property {number} statusCode - 400
 * @property {string} timeStamp - ISO timestamp
 * @property {string} requestPath - The API endpoint that failed
 * @property {Object.<string, string>} fieldErrors - Key-value map of form field names and their specific localized error message
 */

export {};
