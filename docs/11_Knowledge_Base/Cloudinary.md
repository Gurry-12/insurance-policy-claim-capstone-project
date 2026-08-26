# Cloudinary

## What It Is
- An external media cloud service used to store and serve claim documents (PDFs and images). The backend integrates with the **Cloudinary HTTP SDK 1.39.0**.
- Uploads return metadata including a `secure_url` (HTTPS delivery URL) and a `public_id` (used to delete the asset).
- Credentials (`cloudinary.cloud-name`, `api-key`, `api-secret`) are read from `env.properties` at the backend root (gitignored).

## Why It Is Used
- Offloads file storage, bandwidth, and CDN delivery from the application and MySQL.
- Keeps the database small: `ClaimDocument` stores only the Cloudinary URL and public id.
- Simple, HTTP-based SDK makes upload and delete trivial.

## Where It Is Used in This Project
- `config/CloudinaryConfig.java`: builds the `Cloudinary` bean from configuration values.
- `service/CloudinaryService.java` + `serviceimpl/CloudinaryServiceImpl.java`:
  - `uploadFile(MultipartFile)` uploads bytes to the `insurance_claims` folder and returns the metadata map.
  - `deleteFile(String publicId)` destroys an asset by public id.
- `serviceimpl/ClaimDocumentServiceImpl.java`: calls `cloudinaryService.uploadFile(file)` for each claim document and stores `secure_url` as `documentReference`.
- `model/ClaimDocument.java`: persists `documentReference` (secure URL) and `publicId`.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/CloudinaryConfig.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/CloudinaryServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/CloudinaryService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimDocumentServiceImpl.java

## Related Docs
- ../02_Business_Domain/Claim_Workflow.md
- ../03_API/Claim_API.md
- ../11_Developer_Guide/Setup.md

## Common Interview Questions
1. How is the Cloudinary client configured? — `CloudinaryConfig` reads `cloudinary.cloud-name`, `api-key`, and `api-secret` (from gitignored `env.properties`) and exposes a `Cloudinary` bean.
2. Where do claim files get uploaded? — `CloudinaryServiceImpl.uploadFile` uploads to the `insurance_claims` folder; the returned `secure_url` is stored on `ClaimDocument.documentReference`.
3. Why store URLs instead of files? — Storage, scaling, and delivery are handled by the cloud service; the database and app stay small and fast.
4. How would a document be removed? — `CloudinaryServiceImpl.deleteFile(publicId)` destroys the asset; the `public_id` is persisted on `ClaimDocument`.
5. What happens if the service is unavailable? — The upload throws `IOException`, surfaced by the generic error path; files never reach the database without a successful Cloudinary response.
