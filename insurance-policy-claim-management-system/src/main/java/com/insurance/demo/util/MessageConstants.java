package com.insurance.demo.util;

public final class MessageConstants {

    private MessageConstants() {
        // Prevent instantiation
    }

    public static final class Auth {
        public static final String INVALID_CREDENTIALS = "Invalid credentials or account unavailable.";
        public static final String EMAIL_NOT_VERIFIED = "Please verify your email address before logging in.";
        public static final String PHONE_NOT_VERIFIED = "Please verify your phone number before logging in.";
        public static final String ACCOUNT_DEACTIVATED = "Your account is deactivated. Please contact support.";
        public static final String EMAIL_ALREADY_REGISTERED = "Email address is already registered.";
        public static final String MOBILE_ALREADY_REGISTERED = "Duplicate user found with mobile number: ";
        public static final String ACCOUNT_ALREADY_EXISTS = "An account already exists with this email or mobile number.";
        public static final String LOGIN_SUCCESS = "User logged in successfully.";
        public static final String REGISTRATION_SUCCESS = "Customer registered successfully. OTP sent to email and phone.";
        public static final String STAFF_REGISTERED = "Staff account created successfully. OTP sent to email and phone.";
        public static final String ACCOUNT_ACTIVATED = "User account activated successfully.";
        public static final String OTP_RESENT = "OTP has been resent to your email and phone.";
        public static final String FORGOT_PASSWORD_OTP = "If an account exists with this email, an OTP has been sent to the registered email and phone number.";
        public static final String PASSWORD_RESET_SUCCESS = "Password has been reset successfully.";

        public static final String OTP_LIMIT_EXCEEDED = "You have reached the maximum limit of 4 OTP requests in the last 24 hours.";
        public static final String OTP_RETRY_WAIT = "Please wait at least 60 seconds before requesting another OTP.";
        public static final String OTP_NOT_FOUND = "No active OTP found. Please request a new OTP.";
        public static final String OTP_EXPIRED = "The OTP has expired. Please request a new OTP.";
        public static final String INVALID_EMAIL_OTP = "Invalid email OTP.";
        public static final String INVALID_PHONE_OTP = "Invalid phone OTP.";
        public static final String SESSION_EXPIRED = "Session expired. Please sign in again.";
        public static final String TOKEN_REFRESHED = "Session refreshed successfully.";
        public static final String LOGOUT_SUCCESS = "You have been logged out successfully.";

        public static final String USERS_RETRIEVED = "Users retrieved successfully.";
        public static final String USER_RETRIEVED = "User details retrieved successfully.";
    }

    public static final class Customer {
        public static final String ONLY_CUSTOMERS_CREATE_PROFILE = "Only customers can create customer profiles.";
        public static final String UNDER_AGE_LIMIT = "Customer must be at least 18 years old.";
        public static final String PROFILE_COMPLETED = "Customer profile completed successfully.";
        public static final String PROFILE_UPDATED = "Customer profile updated successfully.";
        public static final String DETAILS_RETRIEVED = "Customer details retrieved successfully.";
        public static final String ALL_RETRIEVED = "Customer records retrieved successfully.";
        public static final String PROFILE_NOT_FOUND = "Customer profile not found.";
    }

    public static final class Product {
        public static final String ALREADY_EXISTS = "An insurance product with this name already exists: ";
        public static final String CREATED_SUCCESS = "Insurance product created successfully.";
        public static final String UPDATED_SUCCESS = "Insurance product updated successfully.";
        public static final String NOT_FOUND = "Product not found with ID: ";
        public static final String ALREADY_INACTIVE = "The selected insurance product is already marked as inactive.";
        public static final String DEACTIVATED_SUCCESS = "Insurance product deactivated successfully.";
        public static final String INVALID_FILTER_TYPE = "Invalid product type filter: ";
        public static final String ACTIVE_NOT_FOUND = "No active insurance products found.";
        public static final String ACTIVE_FETCHED = "Active products fetched successfully.";
        public static final String ALREADY_ACTIVE = "Product is already active.";
        public static final String ACTIVATED_SUCCESS = "Product activated successfully.";
        public static final String DETAILS_RETRIEVED = "Product details retrieved successfully.";
        public static final String ALL_RETRIEVED = "Products retrieved successfully.";
    }

    public static final class PolicyPlan {
        public static final String COVERAGE_LIMIT = "The policy coverage amount must strictly exceed the required premium amount.";
        public static final String UNDER_INACTIVE_PRODUCT = "Cannot create a policy plan under an inactive insurance product.";
        public static final String ALREADY_EXISTS = "Policy plan already exists with name: ";
        public static final String CREATED_SUCCESS = "Policy plan created successfully.";
        public static final String INACTIVE_UPDATE_RESTRICTED = "Cannot update an inactive policy plan. Please activate it first.";
        public static final String LINK_INACTIVE_PRODUCT = "Cannot link a policy plan to an inactive insurance product.";
        public static final String PLAN_NAME_DUPLICATE = "Plan name already exists: ";
        public static final String UPDATED_SUCCESS = "Policy plan updated successfully.";
        public static final String ALREADY_INACTIVE = "The policy plan is already marked as inactive.";
        public static final String DEACTIVATED_SUCCESS = "Policy plan deactivated successfully.";
        public static final String ALREADY_ACTIVE = "The policy plan is already marked as active.";
        public static final String ACTIVATED_SUCCESS = "Policy plan activated successfully.";
        public static final String ACTIVE_FETCHED = "Active policy plans retrieved successfully.";
        public static final String ACTIVE_UNDER_PRODUCT_FETCHED = "Active plans under product retrieved successfully.";
        public static final String NOT_FOUND = "Policy plan not found with ID: ";
        public static final String PLAN_NOT_ACTIVE = "The selected policy plan is not currently active.";
        public static final String DETAILS_RETRIEVED = "Policy plan retrieved successfully.";
        public static final String ALL_RETRIEVED = "Plans retrieved successfully.";
    }

    public static final class Policy {
        public static final String COMPLETE_PROFILE_FIRST = "Please complete your customer profile before purchasing a policy.";
        public static final String HEALTH_POLICY_EXISTS = "This health policy is already active or pending payment.";
        public static final String POLICY_EXISTS = "This policy is already pending payment.";
        public static final String PURCHASED_SUCCESS = "Policy purchased successfully and is pending payment.";
        public static final String ISSUED_SUCCESS = "Policy issued successfully to the customer.";
        public static final String DETAILS_RETRIEVED = "Policy details retrieved successfully.";
        public static final String ALL_RETRIEVED = "Policies retrieved successfully.";
        public static final String INVALID_STATUS_FILTER = "Invalid policy status filter: ";
        public static final String CANCEL_INACTIVE_RESTRICTED = "Cannot cancel a policy that is already ";
        public static final String CANCEL_WITH_OPEN_CLAIMS = "Policy cannot be cancelled while a claim is still pending or under review.";
        public static final String CANCELLED_SUCCESS = "Policy cancelled successfully.";
        public static final String NOT_FOUND = "Policy not found with ID: ";
    }

    public static final class Payment {
        public static final String RECORDED_SUCCESS = "Payment recorded successfully.";
        public static final String FETCHED_SUCCESS = "Payments fetched successfully.";
        public static final String ALL_RETRIEVED = "Payments retrieved successfully.";
        public static final String HISTORY_FETCHED = "Payment history fetched successfully.";
        public static final String POLICY_PAYMENTS_FETCHED = "Payments for policy fetched successfully.";
        public static final String AMOUNT_MISMATCH = "Payment amount must match premium amount.";
        public static final String CANCELLED_POLICY_RESTRICTED = "Cannot make payment for a cancelled policy.";
        public static final String EXPIRED_POLICY_RESTRICTED = "Cannot make payment for an expired policy.";
        public static final String ONE_TIME_ALREADY_PAID = "Premium has already been paid for this ONE_TIME plan.";
        public static final String EARLY_PAYMENT_RESTRICTION = "Next annual premium can be paid only after ";
        public static final String ALL_PREMIUMS_PAID = "All annual premiums for this policy have already been paid.";
        public static final String DUPLICATE_REFERENCE = "Transaction reference already exists.";
        public static final String PREMIUM_LIMIT_EXCEEDED = "Total payments would exceed the required premium for this policy.";
        public static final String INVALID_STATUS_FILTER = "Invalid payment status filter: ";
    }

    public static final class Claim {
        public static final String AMOUNT_MUST_BE_POSITIVE = "Claim amount must be strictly greater than 0.";
        public static final String POLICY_NOT_OWNED = "Claims can only be filed against your own active policies.";
        public static final String POLICY_NOT_ACTIVE = "Claim can only be raised against active policies.";
        public static final String EXCEEDS_LIMIT = "The requested claim amount exceeds your remaining policy coverage of ";
        public static final String FUTURE_INCIDENT_DATE = "Incident date cannot be in the future.";
        public static final String INCIDENT_DATE_OUT_OF_BOUNDS = "Incident date should be between the policy period.";
        public static final String SUBMITTED_SUCCESS = "Claim submitted successfully with supporting documents.";
        public static final String DETAILS_RETRIEVED = "Claim details retrieved successfully.";
        public static final String CLAIMS_RETRIEVED = "Claims retrieved successfully.";
        public static final String ALL_RETRIEVED = "All claims retrieved successfully.";
        public static final String CUSTOMER_CLAIMS_RETRIEVED = "Customer claims retrieved successfully.";
        public static final String HISTORY_RETRIEVED = "Claim status history retrieved successfully.";
        public static final String INVALID_STATUS_FILTER = "Invalid claim status provided for filtering: ";
        public static final String STATUS_UPDATED_REVIEW = "Claim status updated to under review.";
        public static final String ASSIGNED_SUCCESS = "Claim successfully assigned.";
    }

    public static final class ClaimReview {
        public static final String STAFF_RECOMMENDATION_ONLY = "Internal staff can only recommend approval or rejection of a claim.";
        public static final String ADMIN_DECISION_ONLY = "Administrators can only finalize claims by approving or rejecting them.";
        public static final String DECISION_ALREADY_MADE = "The final decision for this claim has already been made.";
        public static final String MUST_BE_UNDER_REVIEW = "The claim must be under review before a recommendation can be made.";
        public static final String MUST_BE_REVIEWED_FIRST = "The claim must be reviewed and recommended by an Internal Staff before a final decision.";
        public static final String ALREADY_FINALIZED = "This claim has already been approved or rejected and cannot be modified.";
        public static final String RECOMMENDATION_SUBMITTED = "Claim review recommendation submitted successfully.";
        public static final String FINAL_DECISION_RECORDED = "Final decision on the claim has been recorded successfully.";
        public static final String MUST_BE_UNDER_REVIEW_TO_ASSIGN = "Claim must be UNDER_REVIEW to be assigned.";
        public static final String ALREADY_ASSIGNED = "Claim is already assigned to another staff member.";
        public static final String MOVE_TO_UNDER_REVIEW_RESTRICTED = "Only newly submitted claims can be moved to the under review status.";
        public static final String ASSIGN_MUST_BE_SUBMITTED = "Claim must be SUBMITTED to be assigned.";
    }

    public static final class Document {
        public static final String AT_LEAST_ONE_REQUIRED = "At least one supporting document must be provided.";
        public static final String CANNOT_BE_EMPTY = "Uploaded document cannot be empty.";
        public static final String INVALID_FILE_NAME = "Uploaded document must have a valid file name.";
        public static final String INVALID_FILE_TYPE_JPEG_PNG_PDF = "Only JPEG, PNG, and PDF documents are accepted.";
        public static final String INVALID_FILE_TYPE_PDF_IMAGE = "Only PDF and image files are allowed.";
        public static final String EXCEEDS_SIZE_10MB = "Each document must not exceed 10 MB in size.";
        public static final String EXCEEDS_SIZE_5MB = "File size exceeds the 5MB limit.";
        public static final String UPLOAD_OWN_CLAIMS_ONLY = "You are only permitted to upload supporting documents to your own claims.";
        public static final String UPLOADED_SUCCESS = "Supporting documents uploaded successfully.";
    }

    public static final class Common {
        public static final String SORT_DIRECTION_INVALID = "Sort direction must be asc or desc.";
        public static final String INTERNAL_SERVER_ERROR = "Something went wrong.";
        public static final String VALIDATION_FAILED = "Validation Failed.";
        public static final String INVALID_INPUT = "Invalid input. Please provide valid data.";
        public static final String INVALID_JSON_BODY = "Invalid JSON request body.";
        public static final String DB_CONSTRAINT_VIOLATION = "Duplicate or invalid database value.";
        public static final String CONFLICT_RECORD_MODIFIED = "The requested record has already been modified or is no longer available.";
        public static final String PLAN_NOT_ACTIVE_ERROR_TYPE = "PLAN_NOT_ACTIVE";
    }

    public static final class Security {
        public static final String ACCESS_DENIED = "Access is denied.";
        public static final String UNAUTHORIZED = "Authentication failed. Please login again.";
        public static final String STAFF_SPECIALITY_ACCESS_DENIED = "You are not authorized to perform actions on claims outside your product speciality.";
        public static final String SPECIALITY_VIEW_DENIED = "You are not authorized to view details outside your product speciality.";
        public static final String SPECIALITY_ASSIGN_DENIED = "You are not authorized to assign claims outside your product speciality.";
        public static final String SPECIALITY_ISSUE_DENIED = "You are not authorized to issue policies outside your product speciality.";
        public static final String SPECIALITY_CANCEL_DENIED = "You are not authorized to cancel policies outside your product speciality.";
        public static final String SPECIALITY_RECORD_PAYMENT_DENIED = "You are not authorized to record payments outside your product speciality.";
        public static final String SPECIALITY_VIEW_PAYMENT_DENIED = "You are not authorized to view payments outside your product speciality.";
        public static final String SPECIALITY_VIEW_CLAIM_DENIED = "You are not authorized to view claims outside your product speciality.";
        public static final String SPECIALITY_CLAIM_HISTORY_DENIED = "You are not authorized to access claim history outside your product speciality.";
        public static final String SPECIALITY_TRANSITION_DENIED = "You are not authorized to transition claims outside your product speciality.";

        public static final String NOT_OWN_CLAIM_HISTORY = "You are not allowed to access another customer's claim history.";
        public static final String NOT_OWN_CLAIM = "You do not have permission to view this claim.";
        public static final String NOT_OWN_POLICY_PAYMENT = "You are not allowed to record payment for another customer's policy.";
        public static final String NOT_OWN_POLICY_CLAIMS = "You are not allowed to access claims for another customer's policy.";
        public static final String NOT_OWN_PAYMENT = "You are not allowed to view this payment.";
        public static final String NOT_OWN_POLICY = "You are not allowed to access another customer's policy details.";
        public static final String NOT_OWN_PROFILE = "You are not allowed to access another customer's profile.";

        public static final String OWN_ACCOUNT_ACTIVATION_RESTRICTED = "You cannot manually activate your own account.";
        public static final String OWN_ACCOUNT_DEACTIVATION_RESTRICTED = "You cannot manually deactivate your own account.";
        public static final String PERMISSION_DENIED = "Permission denied.";

        public static final String REVIEW_ASSIGNED_TO_OTHER = "You are not authorized to review this claim. It is assigned to another staff member.";
    }

    public static final class Validation {
        public static final String FULL_NAME_REQUIRED = "Full name is required.";
        public static final String LETTERS_SPACES_ONLY = "Only letters and spaces are allowed.";
        public static final String NAME_SIZE = "Full name must be between 2 and 100 characters.";
        public static final String VALID_EMAIL = "Enter valid email.";
        public static final String EMAIL_REQUIRED = "Email is required.";
        public static final String PASSWORD_REQUIRED = "Password is required.";
        public static final String PASSWORD_PATTERN = "Password must be at least 8 characters long and contain at least one letter and one digit.";
        public static final String MOBILE_REQUIRED = "Mobile number is required.";
        public static final String MOBILE_PATTERN = "Use international format, example: +919876543210.";
        public static final String SPECIALITY_REQUIRED = "Product speciality is required.";

        public static final String DOB_PAST = "Date of birth must be in the past.";
        public static final String ADDRESS_REQUIRED = "Address is required.";
        public static final String CITY_REQUIRED = "City is required.";
        public static final String STATE_REQUIRED = "State is required.";
        public static final String PIN_CODE_VALID = "Enter valid PIN code.";
        public static final String NOMINEE_NAME_REQUIRED = "Nominee name is required.";
        public static final String NOMINEE_RELATION_REQUIRED = "Nominee relation is required.";

        public static final String EMAIL_OTP_REQUIRED = "email OTP is required.";
        public static final String PHONE_OTP_REQUIRED = "phone OTP is required.";
        public static final String NEW_PASSWORD_REQUIRED = "new password is required.";
        public static final String PASSWORD_MIN_SIZE = "password must be at least 8 characters long.";

        public static final String PRODUCT_ID_REQUIRED = "Product Id is required.";
        public static final String PRODUCT_NAME_REQUIRED = "Product name is required.";
        public static final String PRODUCT_TYPE_REQUIRED = "Product type is required.";
        public static final String DESCRIPTION_REQUIRED = "Description is required.";
        public static final String ACTIVE_STATUS_REQUIRED = "Active status is required.";

        public static final String PLAN_NAME_REQUIRED = "Plan name is required.";
        public static final String COVERAGE_REQUIRED = "Coverage amount must be greater than zero.";
        public static final String PREMIUM_REQUIRED = "Premium amount must be greater than zero.";
        public static final String PREMIUM_TYPE_REQUIRED = "Premium type is required.";
        public static final String DURATION_REQUIRED = "Duration must be greater than zero.";
        public static final String DURATION_MAX = "Duration cannot exceed 40 years.";
        public static final String TERMS_REQUIRED = "Terms and conditions are required.";

        public static final String START_DATE_REQUIRED = "Start date is required.";
        public static final String START_DATE_PAST_PRESENT = "start date can not be in future.";

        public static final String CUSTOMER_ID_REQUIRED = "Customer Id is required.";
        public static final String PLAN_ID_REQUIRED = "Plan Id is required.";
        public static final String REMARKS_REQUIRED = "Remarks are required.";

        public static final String DOCUMENT_NAME_REQUIRED = "Document name is required.";
        public static final String DOCUMENT_TYPE_REQUIRED = "Document type is required.";

        public static final String POLICY_ID_REQUIRED = "Policy Id is required.";
        public static final String CLAIM_AMOUNT_REQUIRED = "Claim amount is required.";
        public static final String CLAIM_AMOUNT_POSITIVE = "Claim amount must be strictly greater than 0.";
        public static final String CLAIM_REASON_REQUIRED = "Claim reason is required.";
        public static final String INCIDENT_DATE_REQUIRED = "Incident date is required.";
        public static final String STATUS_REQUIRED = "Status is required.";

        public static final String PAYMENT_AMOUNT_POSITIVE = "Payment amount must be strictly greater than 0.";
        public static final String PAYMENT_MODE_REQUIRED = "Payment mode is required.";
    }
}
