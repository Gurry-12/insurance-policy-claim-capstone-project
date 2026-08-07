import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormTextarea from '../../../components/forms/FormTextarea';
import FormGuidelines from '../../../components/ui/FormGuidelines';
import AlertModal from '../../../components/modals/AlertModal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import { getProductById, updateProduct } from '../../../services/productService';
import { notify } from "../../../utils/notificationService";
import { STATUS_OPTIONS } from "../../../utils/options";

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: 'HEALTH',
    description: '',
    status: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { 
    setLoading(true);
    getProductById(id)
      .then((data) => {
        if (data) {
          setFormData({
            name: data.productName || '',
            category: data.productType || 'HEALTH',
            description: data.description || data.productDescription || '',
            status: data.active ?? data.isActive ?? true
          });
        }
      })
      .catch(() => setError('Could not load product details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGlobalError('');
    setSubmitting(true);
    const errs = {};

    if (!formData.name?.trim()) {
      errs.name = 'Product Name is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      errs.name = 'Only letters and spaces are allowed in the product name.';
    }

    if (!formData.description?.trim()) {
      errs.description = 'Description is required';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setGlobalError('Please correct the highlighted fields.');
      setSubmitting(false);
      return;
    }

    const payload = {
      productName: formData.name,
      productType: formData.category,
      description: formData.description,
      activeStatus: formData.status
    };

    updateProduct(id, payload)
      .then((res) => {
        notify.success(res, 'Product updated successfully!');
        navigate(`/admin/products/${id}`);
      })
      .catch((err) => {
        if (err.fieldErrors) {
          setErrors(err.fieldErrors);
          setGlobalError("Please correct the highlighted fields.");
          notify.error("Please correct the highlighted fields.");
        } else {
          const msg = typeof err === 'string' ? err : (err.message || "Failed to update product.");
          setGlobalError(msg);
          notify.error(msg);
        }
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return <LoadingSpinner text="Loading product details..." />;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <PageHeader
        title="Edit Product"
        subtitle={`Editing Product: ${formData.name || 'Details'}`}
        onBack={() => navigate("/admin/products")}
      />

      <FormGuidelines
        title="Rules for Editing a Product"
        rules={[
          "Product Name is required and can only contain letters and spaces.",
          "Product Description is required.",
          "Select the appropriate Category for the product."
        ]}
        defaultExpanded={false}
      />

      <ErrorAlert message={globalError || error} onClose={() => { setError(''); setGlobalError(''); }} />

      {!error && (
        <div
          className="card border-0"
          style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}
        >
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit} noValidate>
              <div className="row">
                <div className="col-md-6">
                  <FormInput
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={errors.name}
                  />
                </div>
                <div className="col-md-6">
                  <FormSelect
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    options={[
                      { value: "HEALTH", label: "Health" },
                      { value: "MOTOR", label: "Motor" },
                      { value: "LIFE", label: "Life" },
                      { value: "TRAVEL", label: "Travel" },
                      { value: "INSURANCE", label: "Insurance" },
                    ]}
                    error={errors.category}
                  />
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-12">
                  <FormTextarea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    error={errors.description}
                  />
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-6">
                  <FormSelect
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    options={STATUS_OPTIONS}
                    error={errors.status}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-5">
                <button
                  type="button"
                  className="btn btn-light px-4"
                  style={{ borderRadius: "8px" }}
                  onClick={() => navigate("/admin/products")}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  style={{ borderRadius: "8px" }}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={showSuccess}
        type="success"
        title="Product Updated!"
        message="The changes to the product have been saved successfully."
        onClose={() => {
          setShowSuccess(false);
          navigate("/admin/products");
        }}
      />
    </div>
  );
};

export default EditProductPage;
