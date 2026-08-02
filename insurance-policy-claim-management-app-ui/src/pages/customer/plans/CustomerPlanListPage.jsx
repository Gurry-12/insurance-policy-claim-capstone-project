import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { getActivePlans, getPlansByProduct } from "../../../services/planService";
import PageHeader from "../../../components/common/PageHeader";
import Modal from "../../../components/ui/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import PaginationBar from "../../../components/tables/PaginationBar";
import useClientPagination from "../../../hooks/useClientPagination";
import { ShieldCheck, Clock, Sparkles, ArrowRight, Layers, Wallet, FileText, ChevronRight } from "lucide-react";

const formatLakhs = (value) => {
  const lakhs = Number(value) / 100000;
  const rounded = Math.round(lakhs * 10) / 10;
  return `${rounded.toLocaleString("en-IN")}L`;
};

const getPremiumTypeLabel = (plan) => {
  const type = plan.supportedPremiumType || plan.supportedPremiumTypes?.[0];
  if (type === "ONE_TIME") return { label: "One-time Premium", badge: "bg-warning-subtle text-warning-emphasis" };
  if (type === "ANNUAL") return { label: "Annual Premium", badge: "bg-info-subtle text-info-emphasis" };
  return { label: "Flexible Premium", badge: "bg-secondary-subtle text-secondary-emphasis" };
};

const CustomerPlanListPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tncPlan, setTncPlan] = useState(null);
  const { productId } = useParams();
  const { page, setPage, totalPages, pageItems } = useClientPagination(plans, 9);

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
        <LoadingSpinner />
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
        {pageItems.map((plan) => {
          const premiumType = getPremiumTypeLabel(plan);
          const coverageOptions = (plan.coverageOptions || [])
            .filter((opt) => (opt.isActive ?? opt.active) !== false)
            .slice(0, 3);
          const durations = plan.allowedDurations && plan.allowedDurations.length > 0
            ? [...plan.allowedDurations].sort((a, b) => a - b)
            : [];

          return (
            <div
              className="col-md-6 col-lg-4"
              key={plan.planId}
            >
              <div className="card h-100 border-0 shadow-sm hover-elevate transition-all overflow-hidden">
                <div
                  className="position-relative p-4 text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--ip-brand) 0%, #1e40af 55%, var(--ip-accent-orange) 130%)",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-white bg-opacity-15 rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: 46, height: 46 }}>
                        <ShieldCheck size={26} />
                      </div>
                      <div>
                        <h5 className="fw-bold mb-1 text-white">{plan.planName}</h5>
                        <span className="d-flex align-items-center gap-1 text-white-50 small">
                          <Layers size={13} />
                          {plan.productName}
                        </span>
                      </div>
                    </div>
                    <span className={`badge rounded-pill px-3 py-2 border ${premiumType.badge}`}>
                      <Sparkles size={12} className="me-1" />
                      {premiumType.label}
                    </span>
                  </div>

                  <div className="position-absolute" style={{ right: 14, bottom: 10, opacity: 0.08 }}>
                    <ShieldCheck size={72} />
                  </div>
                </div>

                <div className="card-body p-4 d-flex flex-column">
                  <div className="mb-3">
                    <small className="text-muted fw-medium d-block mb-2">
                      Coverage Options
                    </small>
                    {coverageOptions.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {coverageOptions.map((opt) => {
                          const amount = opt.coverageAmount || opt;
                          return (
                            <span
                              key={opt.id ?? amount}
                              className="badge border rounded-pill px-3 py-2 text-dark fw-semibold"
                              style={{ background: "var(--ip-brand-light)", borderColor: "var(--ip-brand-muted) !important" }}
                            >
                              ₹{formatLakhs(amount)}
                            </span>
                          );
                        })}
                        {(plan.coverageOptions || []).filter((opt) => (opt.isActive ?? opt.active) !== false).length > 3 && (
                          <span className="badge rounded-pill px-3 py-2 text-muted fw-semibold">
                            + more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small">Configure at purchase</span>
                    )}
                  </div>

                  <div className="mb-3">
                    <small className="text-muted fw-medium d-block mb-2">
                      Policy Terms
                    </small>
                    {durations.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {durations.map((dur) => (
                          <span
                            key={dur}
                            className="badge rounded-pill px-3 py-2 bg-light text-secondary fw-medium border"
                            style={{ borderColor: "var(--ip-border)" }}
                          >
                            {dur} Year{dur > 1 ? "s" : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="d-inline-flex align-items-center gap-1 text-muted small">
                        <Clock size={13} />
                        Custom term available
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <small className="text-muted fw-medium d-block mb-2 d-inline-flex align-items-center gap-1">
                      <FileText size={13} />
                      About this Plan
                    </small>
                    <div className="bg-light rounded-3 p-3" style={{ border: "1px solid var(--ip-border)" }}>
                      <p
                        className="text-secondary mb-2"
                        style={{
                          fontSize: "0.85rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {plan.termsAndConditions || "No terms and conditions provided."}
                      </p>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 border-0 text-primary fw-medium text-decoration-none d-inline-flex align-items-center gap-1"
                        onClick={() => setTncPlan(plan)}
                      >
                        Read full terms
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 d-flex justify-content-between align-items-center border-top" style={{ borderColor: "var(--ip-border)" }}>
                    <span className="d-inline-flex align-items-center gap-1 text-muted small">
                      <Wallet size={13} />
                      Best value plan
                    </span>
                    <Link
                      className="btn btn-primary px-4 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-1"
                      to={`/customer/purchase-policy/${plan.planId}`}
                    >
                      Get Quote
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {plans.length === 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <EmptyState
                  icon="bi-shield-exclamation"
                  title="No plans available"
                  message="There are no active plans for this product right now."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {plans.length > 0 && (
        <div className="mt-4">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <Modal
        isOpen={!!tncPlan}
        onClose={() => setTncPlan(null)}
        title={tncPlan ? `${tncPlan.planName} — Terms & Conditions` : ""}
      >
        <div
          className="text-muted"
          style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", lineHeight: 1.7 }}
        >
          {tncPlan?.termsAndConditions}
        </div>
      </Modal>

    </div>
  );
};

export default CustomerPlanListPage;
