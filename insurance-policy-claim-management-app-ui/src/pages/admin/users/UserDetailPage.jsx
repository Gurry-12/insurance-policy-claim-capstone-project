import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { getUserById, activateUser, deactivateUser } from '../../../services/userService';
import toast from 'react-hot-toast';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserData = useCallback((userId = id) => {
    setLoading(true);
    setError('');
    getUserById(userId)
      .then((data) => {
        if (!data) {
          setError('Could not load user details.');
        } else {
          setUser(data);
        }
      })
      .catch((err) => {
        console.error("User fetch error:", err);
        setError(err.message || err.message || 'Could not load user details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchUserData(id);
  }, [id, fetchUserData]);

  const handleStatusToggle = () => {
    const isActive = user?.isActive;
    const action = isActive ? deactivateUser(id) : activateUser(id);
    
    setActionLoading(true);
    setStatusModalOpen(false);
    
    action
      .then(() => {
        toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully!`);
        setStatusModalOpen(false);
        fetchUserData(id);
      })
      .catch((err) => {
        toast.error(err.message || `Failed to ${isActive ? 'deactivate' : 'activate'} user.`);
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  if (loading) {
    return <LoadingSpinner text="Loading user details..." />;
  }

  if (error || !user) {
    return (
      <div>
        <PageHeader 
          title="User Details" 
          subtitle="Viewing user"
          onBack={() => navigate('/admin/users')}
        />
        <ErrorAlert message={error || 'User not found.'} />
      </div>
    );
  }

  const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
  const email = user.email || 'N/A';
  const phone = user.mobileNumber || user.phoneNumber || 'N/A';
  const role = user.role || 'N/A';
  const status = user.isActive ? 'Active' : 'InActive';
  const joinedDate = user.createdDate?.split('T')[0] || 'N/A';
  const emailVerified = user.emailVerified ? 'Verified' : 'Not Verified';
  const phoneVerified = user.phoneVerified ? 'Verified' : 'Not Verified';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader 
        title="User Details" 
        subtitle={`Viewing profile for ${name}`}
        onBack={() => navigate('/admin/users')}
        action={
          <div className="d-flex gap-2">
            {status === 'Active' ? (
              <button 
                className="btn btn-outline-warning d-inline-flex align-items-center gap-2" 
                style={{ borderRadius: '8px' }}
                onClick={() => setStatusModalOpen(true)}
                disabled={actionLoading}
              >
                <i className="bi bi-dash-circle"></i>
                Deactivate
              </button>
            ) : (
              <button 
                className="btn btn-outline-success d-inline-flex align-items-center gap-2" 
                style={{ borderRadius: '8px' }}
                onClick={() => setStatusModalOpen(true)}
                disabled={actionLoading}
              >
                <i className="bi bi-check-circle"></i>
                Activate
              </button>
            )}
          </div>
        }
      />

      <div className="row g-4">
        {/* Left Side: Avatar Card */}
        <div className="col-lg-4">
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 d-flex justify-content-center">
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--ip-brand)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h5 className="fw-bold mb-1">{name}</h5>
              <p className="text-muted mb-3">{role}</p>
              <div className="d-flex justify-content-center gap-2 mb-2">
                <StatusBadge status={status} />
              </div>
              <small className="text-muted">Joined: {joinedDate}</small>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Info */}
        <div className="col-lg-8">
          <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4">Contact Information</h6>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Full Name:</div>
                <div className="col-md-8 fw-semibold">{name}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Email Address:</div>
                <div className="col-md-8 fw-semibold">{email}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Phone Number:</div>
                <div className="col-md-8 fw-semibold">{phone}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">System Role:</div>
                <div className="col-md-8 fw-semibold">{role}</div>
              </div>
              {user.productSpeciality && (
                <div className="row mb-3">
                  <div className="col-md-4 text-muted">Staff Speciality:</div>
                  <div className="col-md-8 fw-semibold">{user.productSpeciality}</div>
                </div>
              )}
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Account Status:</div>
                <div className="col-md-8">
                  <StatusBadge status={status} />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Email Verification:</div>
                <div className="col-md-8">
                  <span className={`badge ${user.emailVerified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} px-2.5 py-1.5`}>
                    {emailVerified}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Phone Verification:</div>
                <div className="col-md-8">
                  <span className={`badge ${user.phoneVerified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} px-2.5 py-1.5`}>
                    {phoneVerified}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Created Date:</div>
                <div className="col-md-8 fw-semibold">{joinedDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={statusModalOpen}
        title={status === 'Active' ? "Deactivate User" : "Activate User"}
        message={status === 'Active' 
          ? "Are you sure you want to deactivate this user account? The user will be unable to log in." 
          : "Are you sure you want to activate this user account?"}
        isDanger={status === 'Active'}
        confirmText={status === 'Active' ? "Deactivate" : "Activate"}
        onCancel={() => setStatusModalOpen(false)}
        onConfirm={handleStatusToggle}
      />
    </div>
  );
};

export default UserDetailPage;

