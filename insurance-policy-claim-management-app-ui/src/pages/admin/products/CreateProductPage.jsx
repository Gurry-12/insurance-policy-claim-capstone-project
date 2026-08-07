import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormTextarea from '../../../components/forms/FormTextarea';
import FormGuidelines from '../../../components/ui/FormGuidelines';
import AlertModal from '../../../components/modals/AlertModal';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import { createProduct } from '../../../services/productService';
import { notify } from '../../../utils/notificationService';
import { STATUS_OPTIONS } from "../../../utils/options";

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: 'HEALTH',
    description: '',
    status: true
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (globalError) setGlobalError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setGlobalError('');
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
      setGlobalError('Please fix the highlighted errors below before submitting.');
      setSubmitting(false);
      return;
    }

    const payload = {
      productName: formData.name,
      productType: formData.category,
      description: formData.description,
      activeStatus: formData.status
    };

    createProduct(payload)
      .then((res) => {
        notify.success(res, 'Product created successfully!');
        navigate('/admin/products');
      })
      .catch((err) => {
        if (err.fieldErrors) {
          setErrors(err.fieldErrors);
          setGlobalError("Please correct the highlighted fields.");
          notify.error("Please correct the highlighted fields.");
        } else {
          const msg = err.message || err || 'Failed to create product.';
          setGlobalError(msg);
          notify.error(msg);
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <PageHeader
        title="Create Product"
        subtitle="Add a new insurance product"
        onBack={() => navigate("/admin/products")}
      />

      <FormGuidelines
        title="Rules for Creating a Product"
        rules={[
          "Product Name is required and can only contain letters and spaces.",
          "Product Description is required.",
          "Select the appropriate Category for the product."
        ]}
      />

      {globalError && (
        <div className="mb-4">
          <ErrorAlert message={globalError} onClose={() => setGlobalError('')} />
        </div>
      )}

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
                  placeholder="e.g. Health Shield Premium"
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
                    { value: "INSURANCE", label: "Insurance" }
                  ]}
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
                  placeholder="Enter detailed description of the product"
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
                {submitting ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AlertModal
        isOpen={showSuccess}
        type="success"
        title="Product Created!"
        message="The new insurance product has been successfully added."
        onClose={() => {
          setShowSuccess(false);
          navigate("/admin/products");
        }}
      />
    </div>
  );
};

export default CreateProductPage;
