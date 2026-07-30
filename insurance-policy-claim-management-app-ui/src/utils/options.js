export const NOMINEE_RELATIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Husband', label: 'Husband' },
  { value: 'Wife', label: 'Wife' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Grandfather', label: 'Grandfather' },
  { value: 'Grandmother', label: 'Grandmother' },
  { value: 'Legal Guardian', label: 'Legal Guardian' },
  { value: 'Partner', label: 'Partner' }
];

export const STATUS_OPTIONS = [
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
];



export const PAYMENT_MODE_OPTIONS = [

  { value: "CARD", label: "Card" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
];

export const SPECIALITY_OPTIONS = [
  { value: "HEALTH", label: "Health Specialist" },
  { value: "LIFE", label: "Life Specialist" },
  { value: "MOTOR", label: "Motor Specialist" },
  { value: "TRAVEL", label: "Travel Specialist" },
  { value: "INSURANCE", label: "Insurance Specialist" },
];

export const ROLE_OPTIONS = [
  { value: 'ROLE_ADMIN',           label: 'Admin' },
  { value: 'ROLE_INTERNAL_STAFF',  label: 'Staff' },
  { value: 'ROLE_CUSTOMER',        label: 'Customer' },
];

export const POLICY_STATUS_OPTIONS = [
  { value: 'ACTIVE',          label: 'Active' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'EXPIRED',         label: 'Expired' },
  { value: 'CANCELLED',       label: 'Cancelled' },
];

export const CLAIM_STATUS_OPTIONS = [
  { value: 'SUBMITTED',    label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'RECOMMENDED_FOR_APPROVAL', label: 'Recommended for Approval' },
  { value: 'RECOMMENDED_FOR_REJECTION', label: 'Recommended for Rejection' },
  { value: 'APPROVED',     label: 'Approved' },
  { value: 'REJECTED',     label: 'Rejected' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED',  label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
];

export const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export const PREMIUM_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'ONE_TIME', label: 'One-time' },
];
