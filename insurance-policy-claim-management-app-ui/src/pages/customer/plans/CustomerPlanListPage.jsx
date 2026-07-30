import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { getActivePlans, getPlansByProduct } from "../../../services/planService";
import PageHeader from "../../../components/common/PageHeader";

const CustomerPlanListPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { productId } = useParams();

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let response;
      if (productId) {
        response = await getPlansByProduct(productId);
      } else {
        response = await getActivePlans();
      }
      setPlans(response.data || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Browse Plans"
          subtitle="Explore our insurance plans and find the best coverage for you"
        />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Browse Plans"
          subtitle="Explore our insurance plans and find the best coverage for you"
        />
        <div className="alert alert-danger m-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Browse Plans" 
        subtitle="Explore our insurance plans and find the best coverage for you"
      />

      <div className="row g-4 mt-2">
        {plans.map((plan) => (
          <div
            className="col-md-6 col-lg-4"
            key={plan.planId}
          >
            <div className="card h-100 border-0 shadow-sm hover-elevate transition-all">
              <div className="card-body p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title text-primary fw-bold mb-0">{plan.planName}</h5>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2">
                    Active
                  </span>
                </div>

                <div className="mb-4 text-muted border-bottom pb-3">
                  <i className="bi bi-shield-check me-2 text-primary"></i>
                  {plan.productName}
                </div>

                <div className="mt-auto">
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <div className="p-3 bg-light rounded text-center h-100">
                        <small className="text-muted d-block mb-1">Available Coverage Options</small>
                        <strong className="fs-6 text-dark text-break">
                          {plan.coverageOptions && plan.coverageOptions.length > 0 
                            ? plan.coverageOptions.filter(opt => (opt.isActive ?? opt.active) !== false).map(opt => `₹${((opt.coverageAmount || opt) / 100000)}L`).join(' • ')
                            : "Configure to view"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-muted fw-medium">
                      <i className="bi bi-clock me-2 text-secondary"></i>
                      {plan.allowedDurations && plan.allowedDurations.length > 0
                        ? `${plan.allowedDurations.join(', ')} Years`
                        : "Custom Term"}
                    </span>
                    <Link
                      className="btn btn-primary px-4 py-2 rounded-pill shadow-sm"
                      to={`/customer/purchase-policy/${plan.planId}`}
                    >
                      Get Quote & Purchase
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-12 text-center py-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <div className="text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3 text-secondary"></i>
                  <h5>No active plans available</h5>
                  <p>Please check back later for new insurance plans.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerPlanListPage;
