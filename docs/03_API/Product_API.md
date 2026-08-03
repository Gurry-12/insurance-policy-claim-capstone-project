# Product API

> Endpoints under `/api/products` for admin CRUD and activation of insurance product categories, plus the customer-facing list of active products.

## Purpose

Reference for creating, updating, activating, deactivating, and querying insurance products. Describes the `ProductRequestDTO` field names and validation rules, the `ProductResponseDTO` shape, role restrictions, and pagination.

## Overview

Products are the top-level insurance categories (e.g. HEALTH, MOTOR, LIFE). Plans attach to products, and premium rules attach to plans. The customer-facing catalog (`GET /api/products/active`) returns only active products. Base URL: `http://localhost:8081/api`.

## Business Context

Products model the insurer's lines of business. A deactivated product cannot be used in new quotes, purchases, or claims, and its plans cannot be purchased. Domain rules for products live in `../02_Business_Domain/Product.md` and `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Endpoint matrix

| Method | Path | Role | Response envelope | Notes |
|---|---|---|---|---|
| POST | `/api/products` | ADMIN | `ApiResponseDTO<ProductResponseDTO>` | `201 Created` |
| PUT | `/api/products/{id}` | ADMIN | `ApiResponseDTO<ProductResponseDTO>` | Full update |
| PATCH | `/api/products/{id}/activate` | ADMIN | `ApiResponseDTO<ProductResponseDTO>` | No body |
| PATCH | `/api/products/{id}/deactivate` | ADMIN | `ApiResponseDTO<ProductResponseDTO>` | No body |
| GET | `/api/products/active` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<List<ProductResponseDTO>>` | Customer catalog |
| GET | `/api/products/{id}` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<ProductResponseDTO>` | — |
| GET | `/api/products/page` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PageResponseDTO<ProductResponseDTO>>` | Paginated + filters |

### Create / update request — `ProductRequestDTO`

```json
{
  "productName": "Home Insurance",
  "productType": "INSURANCE",
  "description": "Home insurance covering structure, contents and third-party liability.",
  "activeStatus": true
}
```

Validation (from `ProductRequestDTO.java`):

| Field | Rule |
|---|---|
| `productName` | required, letters/spaces only |
| `productType` | required, `ProductType` enum: `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE` |
| `description` | required, free text |
| `activeStatus` | required boolean — note the field name is `activeStatus`, not `isActive` |

`productName` is unique case-insensitively.

### Response — `ProductResponseDTO`

```json
{
  "productId": 6,
  "productName": "Home Insurance",
  "productType": "INSURANCE",
  "description": "Home insurance covering structure, contents and third-party liability.",
  "isActive": true,
  "createdDate": "2026-08-03T10:00:00"
}
```

Note the response field is `isActive` (boolean) while the request field is `activeStatus`.

### Paginated list

`GET /api/products/page`:

| Query param | Default | Notes |
|---|---|---|
| `pageNumber` | `0` | 0-based |
| `pageSize` | `10` | |
| `sortBy` | `id` | e.g. `id`, `productName`, `productType` |
| `sortDirection` | `asc` | `asc` or `desc` |
| `productType` | — | optional filter |
| `isActive` | — | optional boolean filter |
| `productName` | — | optional partial match |

## Workflow

1. Admin creates a product: `POST /api/products`.
2. Admin updates it: `PUT /api/products/{id}`.
3. Admin toggles availability: `PATCH /api/products/{id}/activate` / `.../deactivate`.
4. All roles read the catalog: `GET /api/products/active`.
5. Staff/admin administer the full list: `GET /api/products/page`.

## Code References

| Concern | Path |
|---|---|
| Controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/InsuranceProductController.java` |
| Request DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/ProductRequestDTO.java` |
| Response DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ProductResponseDTO.java` |
| Product type enum | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/ProductType.java` |
| Sample payloads | `demo-data/api-test-payloads/03-products.json` |

## Diagrams

Product → plan → coverage option → pricing rule relationships are documented in `../04_Database/Table_Descriptions.md` and `../01_System_Architecture/Database_Architecture.md`.

## Best Practices

- Using an enum for `productType` prevents invalid categories at the API boundary.
- Distinct request field (`activeStatus`) vs response field (`isActive`) keeps the write model honest about the intent flag.
- Catalog endpoints reuse the same read path as staff, reducing drift.

## Future Improvements

- Consider soft-delete auditability and a product change history.
- Link to `../10_Evaluation/Future_Enhancements.md`.
