import { useState } from 'react';
import { notify } from '../utils/notificationService';

export const useApiForm = (apiFunction, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (payload, customSuccessCallback) => {
    setLoading(true);
    setFieldErrors({});
    try {
      const response = await apiFunction(payload);
      if (response.success) {
        notify.success(response);
        if (customSuccessCallback) {
          customSuccessCallback(response.data);
        } else if (onSuccess) {
          onSuccess(response.data);
        }
      }
      return response;
    } catch (error) {
      if (error.fieldErrors) {
        setFieldErrors(error.fieldErrors);
        notify.error("Please correct the highlighted fields.");
      } else {
        notify.error(error);
      }
      throw error; // Let caller know it failed if they need to handle it
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, fieldErrors, setFieldErrors };
};
