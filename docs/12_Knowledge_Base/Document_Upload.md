# Document Upload

## What It Is
- Multipart file upload of claim supporting documents. Files are validated, uploaded to Cloudinary, and their metadata persisted in `ClaimDocument` (name, type, `documentReference` = Cloudinary `secure_url`, `publicId`, `uploadedDate`).
- At least one document is required to raise a claim, making documents a mandatory part of the claim workflow.

## Why It Is Used
- Provides evidence for staff/admin claim adjudication.
- Offloads storage and delivery to Cloudinary while keeping the database lean (URLs only).
- Enforces content safety: only images (JPEG/PNG/JPG) and PDFs, with size limits.

## Where It Is Used in This Project
- `serviceimpl/ClaimServiceImpl.java` `raiseClaim`: pre-validates files (PDF or image content types, ≤ 5 MB, non-empty, valid file name) and requires at least one before creating the claim.
- `serviceimpl/ClaimDocumentServiceImpl.java`:
  - `addDocumentsToClaim` / `uploadDocuments`: re-validates type (image/jpeg, image/png, image/jpg, application/pdf; ≤ 10 MB), checks the caller owns the claim, uploads each file, and saves `ClaimDocument` rows.
- `serviceimpl/CloudinaryServiceImpl.java`: performs the actual upload to the `insurance_claims` folder.
- `model/ClaimDocument.java`: persisted metadata.
- `controller/ClaimDocumentController.java`: `/api/document/upload/**`; `SecurityConfig` limits it to `ROLE_CUSTOMER`.
- `repository/ClaimDocumentRepository.java`: lookups by claim.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimDocumentServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/ClaimDocument.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/ClaimDocumentController.java

## Related Docs
- ../02_Business_Domain/Claim_Workflow.md
- ../03_API/Claim_API.md
- ../04_Database/Table_Descriptions.md

## Common Interview Questions
1. What file types are allowed? — Images (JPEG/PNG/JPG) and PDFs; other types are rejected with a `BadRequestException`.
2. What are the size limits? — 5 MB per file when raising a claim, and 10 MB per file on the document-upload endpoint.
3. Where are files stored? — Cloudinary (folder `insurance_claims`); the database stores the returned `secure_url` and `public_id`, not the bytes.
4. Who can upload? — The claim's owner (`ROLE_CUSTOMER`), enforced by URL rules and an ownership check in `ClaimDocumentServiceImpl`.
5. Why is a document required for a claim? — It is part of the business rule that claims need evidence; `raiseClaim` throws if no file is supplied.
