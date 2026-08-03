# Products API — Request Payloads

Request bodies for product endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/products

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Create a new insurance product. `productName` is unique (case-insensitive). Field is `activeStatus` (not `isActive`). |

**Body**

```json
{
  "productName": "Home Insurance",
  "productType": "INSURANCE",
  "description": "Home insurance covering structure, contents and third-party liability.",
  "activeStatus": true
}
```

## PUT /api/products/{id}

| Field | Value |
|---|---|
| Method | `PUT` |
| Auth | ADMIN (Bearer token) |
| Description | Update an existing product (seeded ids 1–5). |

**Body**

```json
{
  "productName": "Home Insurance",
  "productType": "INSURANCE",
  "description": "Home insurance covering structure, contents and liability. Updated description.",
  "activeStatus": true
}
```

## PATCH /api/products/{id}/activate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Activate a product. |

**Body:** none

## PATCH /api/products/{id}/deactivate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Deactivate a product. |

**Body:** none

## GET /api/products/active

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | List active products (seeded: 5). |

**Body:** none

## GET /api/products/{id}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Get product by id (seeded 1–5). |

**Body:** none
