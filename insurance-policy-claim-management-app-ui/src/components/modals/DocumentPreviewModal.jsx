
const DocumentPreviewModal = ({ isOpen, onClose, documentUrl, documentName }) => {
  if (!isOpen || !documentUrl) return null;

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentName || documentUrl) || (documentUrl && documentUrl.startsWith('data:image'));

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={onClose}>
        <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
            <div className="modal-header border-bottom-0">
              <h5 className="modal-title fw-bold text-truncate" style={{ maxWidth: '80%' }}>
                {documentName || 'Document Preview'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body p-0 bg-light d-flex justify-content-center align-items-center" style={{ height: '80vh', overflow: 'hidden' }}>
              {isImage ? (
                <img 
                  src={documentUrl} 
                  alt={documentName || 'Document Preview'} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              ) : (
                <iframe
                  src={documentUrl}
                  title={documentName || 'Document Preview'}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                />
              )}
            </div>
            <div className="modal-footer border-top-0">
              <a href={documentUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary" download>
                <i className="bi bi-download me-2"></i>Download
              </a>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentPreviewModal;
