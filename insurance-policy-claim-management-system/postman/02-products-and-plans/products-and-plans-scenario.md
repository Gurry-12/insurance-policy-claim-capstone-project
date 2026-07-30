# Phase 2: Product Catalog & Policy Plans Setup

*All requests in this section require `Authorization: Bearer {{adminToken}}`.*

## 2.1 Create Insurance Products (10 Products)
**Endpoint:** `POST {{baseUrl}}/api/products`

**Product 1: Comprehensive Health Shield**
```json
{
  "productName": "Comprehensive Health Shield",
  "productType": "HEALTH",
  "description": "Full medical coverage including OPD, maternity, and hospitalization.",
  "isActive": true
}
```

**Product 2: Senior Citizen Care Plus**
```json
{
  "productName": "Senior Citizen Care Plus",
  "productType": "HEALTH",
  "description": "Specialized health insurance for citizens over 60 with pre-existing disease cover.",
  "isActive": true
}
```

**Product 3: Family Floater Elite**
```json
{
  "productName": "Family Floater Elite",
  "productType": "HEALTH",
  "description": "One policy covers the entire family of up to 6 members.",
  "isActive": true
}
```

**Product 4: Pure Term Life Protection**
```json
{
  "productName": "Pure Term Life Protection",
  "productType": "LIFE",
  "description": "High coverage life insurance at low premiums for pure protection.",
  "isActive": true
}
```

**Product 5: Whole Life Plus Wealth**
```json
{
  "productName": "Whole Life Plus Wealth",
  "productType": "LIFE",
  "description": "Life coverage up to 99 years combined with wealth accumulation.",
  "isActive": true
}
```

**Product 6: Child Education Secure**
```json
{
  "productName": "Child Education Secure",
  "productType": "LIFE",
  "description": "Ensure your child's education is funded even in your absence.",
  "isActive": true
}
```

**Product 7: Private Car Bumper-to-Bumper**
```json
{
  "productName": "Private Car Bumper-to-Bumper",
  "productType": "VEHICLE",
  "description": "Comprehensive zero-depreciation car insurance.",
  "isActive": true
}
```

**Product 8: Two-Wheeler Easy Protect**
```json
{
  "productName": "Two-Wheeler Easy Protect",
  "productType": "VEHICLE",
  "description": "Affordable bike insurance with third-party and own damage cover.",
  "isActive": true
}
```

**Product 9: Commercial Fleet Guard**
```json
{
  "productName": "Commercial Fleet Guard",
  "productType": "VEHICLE",
  "description": "Coverage for commercial transport vehicles and fleets.",
  "isActive": true
}
```

**Product 10: Home Property Secure**
```json
{
  "productName": "Home Property Secure",
  "productType": "PROPERTY",
  "description": "Protect your home and contents against fire, theft, and natural disasters.",
  "isActive": true
}
```

*Expected action: Note the IDs of these products (1 through 10) for the next step.*

## 2.2 Create Policy Plans (30 Plans)
**Endpoint:** `POST {{baseUrl}}/api/plans`

### Health Plans (For Product 1, 2, 3)
```json
{
  "productId": 1,
  "planName": "Health Basic 5L",
  "coverageAmount": 500000,
  "premiumAmount": 8000,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "Room rent capped at 1% of sum insured. No maternity cover.",
  "isActive": true
}
```
```json
{
  "productId": 1,
  "planName": "Health Premium 10L",
  "coverageAmount": 1000000,
  "premiumAmount": 14000,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "No room rent cap. Day care procedures covered. Maternity covered after 2 years.",
  "isActive": true
}
```
```json
{
  "productId": 1,
  "planName": "Health Elite 25L",
  "coverageAmount": 2500000,
  "premiumAmount": 28000,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "Global coverage. Unlimited restoration of sum insured.",
  "isActive": true
}
```
```json
{
  "productId": 2,
  "planName": "Senior Silver 3L",
  "coverageAmount": 300000,
  "premiumAmount": 12000,
  "premiumType": "ANNUAL",
  "duration": 3,
  "termsAndConditions": "20% copay on all claims. Pre-existing covered after 1 year.",
  "isActive": true
}
```
```json
{
  "productId": 2,
  "planName": "Senior Gold 5L",
  "coverageAmount": 500000,
  "premiumAmount": 22000,
  "premiumType": "ANNUAL",
  "duration": 3,
  "termsAndConditions": "No copay. Free annual health checkups.",
  "isActive": true
}
```
```json
{
  "productId": 3,
  "planName": "Family Starter 10L (2A+1C)",
  "coverageAmount": 1000000,
  "premiumAmount": 18000,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "Covers 2 Adults and 1 Child.",
  "isActive": true
}
```
```json
{
  "productId": 3,
  "planName": "Family Max 20L (2A+2C)",
  "coverageAmount": 2000000,
  "premiumAmount": 32000,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "Covers 2 Adults and 2 Children. Includes OPD.",
  "isActive": true
}
```

### Life Plans (For Product 4, 5, 6)
```json
{
  "productId": 4,
  "planName": "Term Life 1Cr (Single Premium)",
  "coverageAmount": 10000000,
  "premiumAmount": 250000,
  "premiumType": "ONE_TIME",
  "duration": 20,
  "termsAndConditions": "Suicide clause applicable for first year. Pure risk cover.",
  "isActive": true
}
```
```json
{
  "productId": 4,
  "planName": "Term Life 2Cr (Monthly)",
  "coverageAmount": 20000000,
  "premiumAmount": 2000,
  "premiumType": "MONTHLY",
  "duration": 30,
  "termsAndConditions": "Waiver of premium on critical illness.",
  "isActive": true
}
```
```json
{
  "productId": 4,
  "planName": "Term Life 5Cr (Annual)",
  "coverageAmount": 50000000,
  "premiumAmount": 35000,
  "premiumType": "ANNUAL",
  "duration": 40,
  "termsAndConditions": "Terminal illness benefit included.",
  "isActive": true
}
```
```json
{
  "productId": 5,
  "planName": "Whole Life Assure 50L",
  "coverageAmount": 5000000,
  "premiumAmount": 45000,
  "premiumType": "ANNUAL",
  "duration": 99,
  "termsAndConditions": "Bonus additions every 5 years. Surrender value available.",
  "isActive": true
}
```
```json
{
  "productId": 6,
  "planName": "Child Edu Care 25L",
  "coverageAmount": 2500000,
  "premiumAmount": 25000,
  "premiumType": "ANNUAL",
  "duration": 15,
  "termsAndConditions": "Payout guaranteed at age 18. Premium waiver on death of parent.",
  "isActive": true
}
```

### Vehicle Plans (For Product 7, 8, 9)
```json
{
  "productId": 7,
  "planName": "Car Comprehensive 1Yr",
  "coverageAmount": 600000,
  "premiumAmount": 12000,
  "premiumType": "ONE_TIME",
  "duration": 1,
  "termsAndConditions": "Zero depreciation included. Engine protect add-on available.",
  "isActive": true
}
```
```json
{
  "productId": 7,
  "planName": "Car Comprehensive 3Yr Long Term",
  "coverageAmount": 600000,
  "premiumAmount": 32000,
  "premiumType": "ONE_TIME",
  "duration": 3,
  "termsAndConditions": "Discounted rate for 3-year lock-in. Roadside assistance included.",
  "isActive": true
}
```
```json
{
  "productId": 7,
  "planName": "Car Third Party Only",
  "coverageAmount": 750000,
  "premiumAmount": 3500,
  "premiumType": "ONE_TIME",
  "duration": 1,
  "termsAndConditions": "Only third-party damage covered. No own damage.",
  "isActive": true
}
```
```json
{
  "productId": 8,
  "planName": "Bike Comprehensive 1Yr",
  "coverageAmount": 80000,
  "premiumAmount": 1500,
  "premiumType": "ONE_TIME",
  "duration": 1,
  "termsAndConditions": "Personal accident cover of 15L included.",
  "isActive": true
}
```
```json
{
  "productId": 8,
  "planName": "Bike Comprehensive 5Yr",
  "coverageAmount": 80000,
  "premiumAmount": 6500,
  "premiumType": "ONE_TIME",
  "duration": 5,
  "termsAndConditions": "5 year third party, 5 year own damage.",
  "isActive": true
}
```
```json
{
  "productId": 9,
  "planName": "Commercial Truck Heavy 1Yr",
  "coverageAmount": 2000000,
  "premiumAmount": 45000,
  "premiumType": "ONE_TIME",
  "duration": 1,
  "termsAndConditions": "Goods carrying vehicle cover. Driver accident cover included.",
  "isActive": true
}
```
```json
{
  "productId": 9,
  "planName": "Commercial Cab Passenger 1Yr",
  "coverageAmount": 800000,
  "premiumAmount": 22000,
  "premiumType": "ONE_TIME",
  "duration": 1,
  "termsAndConditions": "Passenger carrying vehicle cover. Covers up to 6 passengers.",
  "isActive": true
}
```

### Property Plans (For Product 10)
```json
{
  "productId": 10,
  "planName": "Home Structure 50L",
  "coverageAmount": 5000000,
  "premiumAmount": 5000,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "Covers building structure against fire, earthquake, and flood.",
  "isActive": true
}
```
```json
{
  "productId": 10,
  "planName": "Home Contents 10L",
  "coverageAmount": 1000000,
  "premiumAmount": 2500,
  "premiumType": "ANNUAL",
  "duration": 5,
  "termsAndConditions": "Covers jewelry, electronics, and furniture against theft.",
  "isActive": true
}
```
```json
{
  "productId": 10,
  "planName": "Home Comprehensive (Structure + Contents)",
  "coverageAmount": 6000000,
  "premiumAmount": 7000,
  "premiumType": "ANNUAL",
  "duration": 10,
  "termsAndConditions": "Complete peace of mind. Alternate accommodation cover included.",
  "isActive": true
}
```
