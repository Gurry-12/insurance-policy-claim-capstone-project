

const LoadingButton = ({
  isLoading,
  loadingText,
  children,
  className = '',
  disabled,
  type = 'button',
  variant = 'primary',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={isLoading || disabled}
      aria-disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
