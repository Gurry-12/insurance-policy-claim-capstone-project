import { useEffect } from 'react';

const useDocumentTitle = (title, retainOnUnmount = false) => {
  useEffect(() => {
    const defaultTitle = document.title;
    document.title = title ? `${title} | InsuranceFlow` : 'InsuranceFlow';

    return () => {
      if (!retainOnUnmount) {
        document.title = defaultTitle;
      }
    };
  }, [title, retainOnUnmount]);
};

export default useDocumentTitle;
