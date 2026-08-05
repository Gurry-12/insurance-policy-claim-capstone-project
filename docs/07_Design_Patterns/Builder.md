</Agent System Instructions>
<Builder Pattern>
> Step-by-step construction of complex objects.

---

## Purpose
Explains the use of the Builder pattern to construct complex Data Transfer Objects (DTOs), domain entities, and API responses clearly and immutably.

---

## Overview
- Heavily utilizes Lombok's `@Builder` annotation.
- Replaces massive constructors and chaining setter methods.
- Ensures immutability for critical objects like Quotes and Policies.

---

## Business Context
When converting a Quote to a Policy, the resulting Policy object requires a user ID, product ID, premium amount, start date, end date, and initial status. Passing all these to a standard constructor (`new Policy(1, 2, 500.0, date1, date2, "ACTIVE")`) is error-prone. The Builder pattern makes this intent obvious.

> **Analogy**: Like ordering a custom sandwich at Subway. You don't ask for a "Sandwich(bread, meat, cheese, lettuce)". You say, "Give me a sandwich, with wheat bread, add turkey, add swiss..." building it step-by-step.

---

## Backend Implementation

### Where Builder is Used
- **Response DTOs**: Standardizing API responses (e.g., `ApiResponse.builder().status(200).data(user).build()`).
- **Entity Creation**: Converting Quote to Policy.
- **Unit Tests**: Rapidly scaffolding mock data objects.

### Code Example Concept
```java
// Instead of this:
Policy p = new Policy(null, quote.getId(), user.getId(), amount, "ACTIVE", start, end);

// We do this:
Policy p = Policy.builder()
    .quoteId(quote.getId())
    .userId(user.getId())
    .premiumAmount(amount)
    .status("ACTIVE")
    .startDate(start)
    .endDate(end)
    .build();
```

---

## Design Decisions
- **Why Builder for complex DTOs?**  
  It prevents "telescoping constructors" (where you have constructors with 2, 3, 4 parameters to handle optional fields). It also allows fields to be `final`, ensuring the object is immutable once constructed, which makes the system thread-safe and less prone to side-effect bugs.

---

## Interview Notes
1. **How is the Builder pattern implemented in this project?**  
   We use Project Lombok's `@Builder` annotation on the class level, which auto-generates the static inner builder class at compile time.
2. **What are the drawbacks of the Builder pattern?**  
   It slightly increases memory overhead due to the creation of the intermediary builder object, but for modern JVMs, this is negligible compared to the readability benefits.
3. **Does `@Builder` work well with JPA Entities?**  
   It can be tricky. JPA requires a no-args constructor (`@NoArgsConstructor`). If you use `@Builder`, you must also explicitly add `@AllArgsConstructor` and `@NoArgsConstructor` to keep Hibernate happy.

---

## Related Documents
- `../07_Design_Patterns/Factory.md`
