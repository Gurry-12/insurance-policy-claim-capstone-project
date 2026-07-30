const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0" style={{ borderRadius: '14px', boxShadow: 'var(--ip-shadow-xl)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Close"></button>
            </div>
            <div className="modal-body py-4">
              <div className="mb-0" style={{ color: 'var(--ip-text-secondary)' }}>{message}</div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light px-4" onClick={onCancel}>
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} px-4`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
