# Customers API — Request Payloads

Request bodies for customer-profile endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/customers

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | CUSTOMER (Bearer token) |
| Description | Create the logged-in customer's profile. Must be done before purchasing. `pinCode` must be 6 digits starting 1–9. |

**Body**

```json
{
  "dateOfBirth": "1990-01-15",
  "address": "123 Main Street, Koramangala",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pinCode": "560034",
  "nomineeName": "Rohit Desai",
  "nomineeRelation": "Spouse"
}
```

## PUT /api/customers/{customerId}

| Field | Value |
|---|---|
| Method | `PUT` |
| Auth | CUSTOMER (Bearer token) |
| Description | Update own profile. Use the `customerId` returned by `GET /api/customers/profile` (seeded: 1, 2, 3, 4). |

**Body**

```json
{
  "dateOfBirth": "1990-01-15",
  "address": "456 New Street, Indiranagar",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pinCode": "560038",
  "nomineeName": "Rohit Desai",
  "nomineeRelation": "Spouse"
}
```

## GET /api/customers/profile

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | CUSTOMER (Bearer token) |
| Description | Fetch own profile. |

**Body:** none

## GET /api/customers

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN or INTERNAL_STAFF (Bearer token) |
| Description | List all customers. |

**Body:** none

## GET /api/customers/{customerId}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN or INTERNAL_STAFF (Bearer token) |
| Description | Get customer by id (seeded 1–4). |

**Body:** none
