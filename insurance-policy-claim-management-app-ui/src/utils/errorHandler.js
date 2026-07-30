import { notify } from './notificationService';
import { extractValidationErrors } from './apiResponse';

export const handleApiError = (error, defaultMessage = "An unexpected error occurred") => {
    
    
    // 1. Handle Validation Error Maps (Multiple Messages)
    const fieldErrors = extractValidationErrors(error);
    if (fieldErrors && typeof fieldErrors === 'object') {
        // Do not throw toasts here. Return them to the caller to display beside fields.
        return { isValidationError: true, messages: fieldErrors };
    }
    
    // 2. Standard Server Errors / Fallbacks handled by notificationService
    notify.error(error, defaultMessage);
    return { isValidationError: false };
};
