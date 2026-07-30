import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getActiveProducts } from "../../../services/productService";
import PageHeader from "../../../components/common/PageHeader";

const CustomerProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getActiveProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Insurance Products"
          subtitle="Browse our comprehensive range of insurance products"
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
          title="Insurance Products"
          subtitle="Browse our comprehensive range of insurance products"
        />
        <div className="alert alert-danger m-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Insurance Products" 
        subtitle="Browse our comprehensive range of insurance products"
      />

      <div className="row g-4 mt-2">
        {products.map((product) => (
          <div
            key={product.productId}
            className="col-md-6 col-lg-4"
          >
            <div className="card h-100 border-0 shadow-sm hover-elevate transition-all">
              <div className="card-body p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title text-primary fw-bold mb-0">
                    {product.productName}
                  </h5>
                  <span className={`badge ${(product.isActive ?? product.active) ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'} border rounded-pill px-3 py-2`}>
                    {(product.isActive ?? product.active) ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-3">
                  <span className="badge bg-light text-dark border px-2 py-1">
                    <i className="bi bi-tag me-1 text-primary"></i>
                    {product.productType}
                  </span>
                </div>

                <p className="card-text text-muted flex-grow-1 bg-light p-3 rounded">
                  {product.description}
                </p>

                <div className="mt-auto pt-3 border-top">
                  <Link 
                    to={`/customer/products/${product.productId}/plans`}
                    className="btn btn-outline-primary w-100"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-12 text-center py-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <div className="text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3 text-secondary"></i>
                  <h5>No insurance products available</h5>
                  <p>We are currently updating our product offerings.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerProductListPage;
