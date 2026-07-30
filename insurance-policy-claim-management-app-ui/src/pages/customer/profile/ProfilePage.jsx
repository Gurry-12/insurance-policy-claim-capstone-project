import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../../../services/customerService";
import CustomerProfilePage from "./CustomerProfilePage";
import PageHeader from "../../../components/common/PageHeader";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();

      setProfile(response.data);
      setProfileExists(true);
    } catch {
      setProfileExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  

  if (loading) return <h4>Loading...</h4>;

  if (!profileExists) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="My Profile" />
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body text-center p-5">
            <h4 className="text-muted mb-4">No Profile Found</h4>
            <Link
              to="/customer/profile/edit"
              className="btn btn-primary px-4 py-2"
            >
              Create Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CustomerProfilePage profile={profile} />;
};

export default ProfilePage;
