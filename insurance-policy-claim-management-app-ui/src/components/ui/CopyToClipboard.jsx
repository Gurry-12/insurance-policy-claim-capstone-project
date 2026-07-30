import { useState } from 'react';
import toast from 'react-hot-toast';

const CopyToClipboard = ({ text, label = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label ? label + ' ' : ''}Copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-sm btn-link text-muted p-0 ms-2"
      title="Copy to clipboard"
    >
      <i className={`bi ${copied ? 'bi-check2 text-success' : 'bi-clipboard'}`} />
    </button>
  );
};

export default CopyToClipboard;
