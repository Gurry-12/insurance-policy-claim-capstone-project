import { Link } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import { User, Phone, Calendar, MapPin, Users, Heart, Edit3 } from "lucide-react";

const CustomerProfilePage = ({ profile }) => {
  return (
    <div className="animate-fade-in pb-5">
      <PageHeader 
        title="My Profile" 
        subtitle="Manage your personal information and account details"
        icon={User}
      />

      <div className="row justify-content-center mt-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Top Gradient Header */}
            <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--ip-primary) 0%, #1e40af 100%)' }}></div>
            
            <div className="card-body p-4 p-md-5 pt-0 position-relative">
              {/* Floating Avatar */}
              <div className="text-center mb-5" style={{ marginTop: '-60px' }}>
                <div 
                  className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center shadow" 
                  style={{ width: '120px', height: '120px', padding: '5px' }}
                >
                  <div 
                    className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-bold"
                    style={{ fontSize: '3rem' }}
                  >
                    {profile.fullName?.charAt(0).toUpperCase() || 'C'}
                  </div>
                </div>
                <h3 className="mb-1 fw-bold text-dark mt-3">{profile.fullName}</h3>
                <p className="text-muted mb-3 fs-5">{profile.email}</p>
                <span className="badge bg-primary text-white rounded-pill px-4 py-2 shadow-sm fw-medium">Customer</span>
              </div>

              <div className="bg-light rounded-4 p-4 mb-4 border shadow-sm">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="bg-white p-2 rounded-3 shadow-sm border me-3 text-primary">
                        <Phone size={20} />
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Mobile Number</div>
                        <div className="fw-bold text-dark">{profile.mobileNumber || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="bg-white p-2 rounded-3 shadow-sm border me-3 text-primary">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Date of Birth</div>
                        <div className="fw-bold text-dark">{profile.dateOfBirth || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="d-flex align-items-start">
                      <div className="bg-white p-2 rounded-3 shadow-sm border me-3 text-primary">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Address</div>
                        <div className="fw-bold text-dark">
                          {profile.address ? `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pinCode}` : 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-light rounded-4 p-4 border shadow-sm">
                <h6 className="text-uppercase text-primary fw-bold mb-4 d-flex align-items-center">
                  <Users size={18} className="me-2" /> Nominee Information
                </h6>
                
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="bg-white p-2 rounded-3 shadow-sm border me-3 text-secondary">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Nominee Name</div>
                        <div className="fw-bold text-dark">{profile.nomineeName || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="bg-white p-2 rounded-3 shadow-sm border me-3 text-secondary">
                        <Heart size={20} />
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Nominee Relation</div>
                        <div className="fw-bold text-dark">{profile.nomineeRelation || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-5">
                <Link
                  to="/customer/profile/edit"
                  state={{ profile }}
                  className="btn btn-primary rounded-pill px-5 py-2 shadow-sm d-inline-flex align-items-center fw-medium"
                >
                  <Edit3 size={18} className="me-2" />
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
