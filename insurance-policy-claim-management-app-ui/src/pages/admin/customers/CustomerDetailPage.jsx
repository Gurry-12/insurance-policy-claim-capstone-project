import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ErrorAlert from "../../../components/ui/ErrorAlert";
import { getCustomerById } from "../../../services/customerService";
import { getPoliciesByCustomerId } from "../../../services/policyService";
import useCustomerPdf from "../../../hooks/PdfDownload/useCustomerPdf";

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { downloadCustomer } = useCustomerPdf();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    
    setLoading(true);
    setError("");

    Promise.all([
      getCustomerById(id).catch(err => {
        console.error("Profile load failed:", err);
        return null;
      }),
      getPoliciesByCustomerId(id).catch(err => {
        console.error("Policies load failed:", err);
        return [];
      })

    ]).then(([customerData, policiesData]) => {
      if (!customerData) {
        setError("Could not load customer profile details.");
      } else {
        setCustomer(customerData);
        setPolicies(policiesData || []);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading customer details..." />;
  }

  if (error || !customer) {
    return (
      <div>
        <PageHeader
          title="Customer Details"
          subtitle="Customer profile details view"
          onBack={() => navigate("/admin/customers")}
        />
        <ErrorAlert message={error || "Customer not found."} />
      </div>
    );
  }

  const name = customer.fullName || "Customer";
  const displayAddress = customer.address
    ? `${customer.address}, ${customer.city || ""}, ${customer.state || ""} ${customer.pinCode || ""}`
        .replace(/,\s*,/g, ",")
        .trim()
    : "N/A";

  return (
    <div>
      <PageHeader
        title="Customer Details"
        subtitle={`Viewing profile for ${name}`}
        action={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
              style={{ borderRadius: '8px' }}
              onClick={() => downloadCustomer(customer)}
            >
              <i className="bi bi-file-earmark-pdf"></i> PDF
            </button>
            <button onClick={() => navigate('/admin/customers')} className="btn btn-outline-secondary d-inline-flex align-items-center gap-1" style={{ borderRadius: '8px' }}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>
        }
      />

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-4">
          <div
            className="card border-0 h-100"
            style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}
          >
            <div className="card-body p-4 text-center">
              <div className="mb-3 d-flex justify-content-center">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: "var(--ip-brand)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    fontWeight: 600,
                  }}
                >
                  {name.charAt(0)}
                </div>
              </div>
              <h5 className="fw-bold mb-1">{name}</h5>

              <hr
                className="my-4"
                style={{ borderColor: "var(--ip-border-light)" }}
              />

              <div className="text-start">
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">Email</small>
                  <span>{customer.email || "N/A"}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">Phone</small>
                  <span>{customer.mobileNumber || "N/A"}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">
                    Date of Birth
                  </small>
                  <span>{customer.dateOfBirth || "N/A"}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">Address</small>
                  <span>{displayAddress}</span>
                </div>
                {customer.nomineeName && (
                  <div className="mb-3">
                    <small className="text-muted d-block fw-bold">
                      Nominee
                    </small>
                    <span>
                      {customer.nomineeName} (
                      {customer.nomineeRelation || "Nominee"})
                    </span>
                  </div>
                )}
                <div>
                  <small className="text-muted d-block fw-bold">Joined</small>
                  <span>{customer.createdDate?.split("T")[0] || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policies & Activity */}
        <div className="col-lg-8">
          <div
            className="card border-0 mb-4"
            style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}
          >
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4">Active & Past Policies</h6>
              {policies.length > 0 ? (
                <div className="table-responsive">
                  <table
                    className="table table-hover align-middle mb-0"
                    style={{ fontSize: "0.875rem" }}
                  >
                    <thead>
                      <tr
                        className="text-muted"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        <th className="border-0">Policy #</th>
                        <th className="border-0">Plan</th>
                        <th className="border-0">Coverage</th>
                        <th className="border-0">Premium</th>
                        <th className="border-0">Expiry Date</th>
                        <th className="border-0">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map((p) => (
                        <tr key={p.policyId}>
                          <td className="fw-bold">{p.policyNumber}</td>
                          <td>{p.planName}</td>
                          <td>₹{Number(p.selectedCoverage || 0).toLocaleString("en-IN")}</td>
                          <td>₹{Number(p.calculatedPremium || p.totalPremiumPaid || p.premium || 0).toLocaleString("en-IN")}</td>
                          <td>{p.endDate}</td>
                          <td>
                            <StatusBadge status={p.policyStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center my-4">
                  No policies found for this customer.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
