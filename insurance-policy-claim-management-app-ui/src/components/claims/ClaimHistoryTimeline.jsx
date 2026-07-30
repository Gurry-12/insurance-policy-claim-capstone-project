import StatusBadge from '../ui/StatusBadge';
import { Clock } from 'lucide-react';

const ClaimHistoryTimeline = ({ history = [] }) => {
  return (
    <div className="card-body">
      {history.length > 0 ? (
        <div className="timeline-wrapper position-relative ps-3 ms-2 mt-2" style={{ borderLeft: '2px solid #e9ecef' }}>
          {history.map((item, index) => (
            <div key={index} className="position-relative mb-4">
              <div 
                className="position-absolute bg-primary rounded-circle" 
                style={{ width: '12px', height: '12px', left: '-23px', top: '5px' }}
              ></div>
              <div className="mb-1">
                <StatusBadge 
                  status={
                    ((item.newStatus || item.status) === "UNDER_REVIEW" || (item.newStatus || item.status) === "SUBMITTED") && 
                    (item.remarks || item.message || item.description || "")?.toLowerCase().includes("assigned")
                      ? "ASSIGNED"
                      : (item.newStatus || item.status)
                  } 
                />
              </div>
              <div className="small text-muted mb-1">
                {new Date(item.updatedDate).toLocaleString()}
              </div>
              <div className="small">
                By: <span className="fw-medium">{item.updatedBy || "System"}</span>
              </div>
              {item.remarks && (
                <div className="small text-muted mt-1 fst-italic">
                  Note: {item.remarks}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted p-4 d-flex flex-column align-items-center">
          <Clock size={40} className="mb-2 opacity-50" />
          <small>No history available yet.</small>
        </div>
      )}
    </div>
  );
};

export default ClaimHistoryTimeline;
