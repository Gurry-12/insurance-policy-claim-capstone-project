> Core principles for maintainable and scalable software architecture.

---

## Purpose
Demonstrates how the InsuranceFlow codebase adheres to the five SOLID object-oriented design principles to ensure long-term maintainability.

---

## Overview
- Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- Provides concrete, real-world examples from the project.

---

## Business Context
Insurance systems live for decades. Code written today must be easily modified by a new team 5 years from now. SOLID principles prevent the codebase from becoming a "Big Ball of Mud."

---

## Backend Implementation

### SOLID Principles in InsuranceFlow

| Principle | Meaning | Example in Project | File |
|-----------|---------|--------------------|------|
| **S** - Single Responsibility | A class should have one reason to change. | `JwtUtil` only handles token generation and validation. It doesn't handle database lookups or user logic. | `utils/JwtUtil.java` |
| **O** - Open/Closed | Open for extension, closed for modification. | `PremiumCalculatorFactory`. We can add a `TravelPremiumCalculator` without changing the Factory or Service classes. | `strategy/*` |
| **L** - Liskov Substitution | Subtypes must be substitutable for base types. | All calculators implement `PremiumCalculator`. The `QuoteService` can use *any* of them interchangeably without knowing the specific type. | `QuoteServiceImpl.java` |
| **I** - Interface Segregation | Don't force clients to depend on methods they don't use. | We separated `NotificationService` into specific interfaces rather than one massive `SystemPort` interface. | `adapter/NotificationAdapter.java` |
| **D** - Dependency Inversion | Depend on abstractions, not concretions. | Controllers depend on `QuoteService` (Interface), not `QuoteServiceImpl` (Class). | `controller/QuoteController.java` |

---

## Interview Notes
1. **Can you give an example of the Open/Closed Principle in your project?**  
   Our Strategy pattern for premium calculation. By implementing the `PremiumCalculator` interface, we can add new insurance product pricing models without touching the core quoting service logic.
2. **How does Dependency Inversion help with testing?**  
   Because our controllers depend on service interfaces, we can inject mock implementations of those interfaces during unit testing, isolating the controller logic from the database.
3. **What is a violation of Single Responsibility?**  
   If our `UserService` handled password hashing, database saving, and sending the welcome email. We split these into `PasswordEncoder`, `UserRepository`, and `NotificationService`.
4. **How did you achieve Interface Segregation?**  
   Instead of a generic `UserRepository` that includes methods for internal staff, we keep standard Spring Data JPA interfaces focused and create custom query interfaces only when needed.
5. **Does Liskov Substitution apply if you don't use inheritance?**  
   Yes, it applies heavily to interfaces. If a method expects a `PremiumCalculator`, any implementation injected must adhere to the contract (e.g., returning a valid BigDecimal, not throwing unexpected runtime exceptions).

---

## Related Documents
- `../07_Design_Patterns/Strategy.md`
- `../07_Design_Patterns/Dependency_Injection.md`
