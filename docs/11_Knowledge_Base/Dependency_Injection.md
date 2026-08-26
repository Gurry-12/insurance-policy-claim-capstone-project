# Dependency Injection

## What It Is
Dependency injection (DI) means a component receives its dependencies
from outside (a container) instead of constructing them itself. In this
project Spring is the IoC container for the backend: beans are declared
with `@Component`/`@Service`/`@Controller`/`@Repository` and wired
mostly through constructor injection.

## Why It Is Used
- Decouples classes: a service depends on an interface, and the
  container supplies a concrete bean at runtime.
- Makes testing easier: dependencies can be swapped for mocks or fakes.
- Centralizes bean lifecycle and configuration (repositories, security,
  mappers, external clients) in one place.

## Where It Is Used in This Project
Verified against the backend:
- Constructor injection is the dominant style, for example
  `UserServiceImpl` (`private final` fields for `AppUserRepository`,
  `ModelMapper`, `PasswordEncoder`, `OtpService`, `SecurityAuditLogger`,
  `RefreshTokenService`), plus `ClaimServiceImpl`, `PolicyServiceImpl`,
  `PremiumPaymentServiceImpl`, `JwtService`, `RefreshTokenService`, and
  `OtpService` (which injects `EmailService`, `SmsService`, and
  `OtpAttemptRecorder`).
- Field injection via `@Autowired` appears in a few places, such as
  `PremiumCalculationServiceImpl` and `PremiumCalculatorFactory`
  (injecting `Map<String, PremiumCalculator>`).
- Spring supplies the framework-injected beans: `ModelMapper`,
  `PasswordEncoder`, `JavaMailSender`, `Cloudinary`,
  `PlatformTransactionManager`, and all JPA repositories.
- The strategy/factory chain relies on it: Spring registers both
  calculators as `PremiumCalculator` beans and hands the registry to the
  factory (see the Strategy and Factory cards).
Frontend angle in this project:
- `src/main.jsx` supplies the global dependencies (`ThemeProvider`,
  `AuthProvider`, `BrowserRouter`) to the whole tree, and custom hooks
  receive their dependencies rather than creating them inside components.
  Axios is configured once in `src/api/axiosInstance.js` and imported by
  every `src/services/*.js`.

## Related Files
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/UserServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculatorFactory.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtService.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/verification/OtpService.java`
- `insurance-policy-claim-management-app-ui/src/api/axiosInstance.js`
- `insurance-policy-claim-management-app-ui/src/main.jsx`

## Related Docs
- ../07_Design_Patterns/Dependency_Injection.md
- ../07_Design_Patterns/Strategy.md
- ../07_Design_Patterns/Factory_Pattern.md
- ../01_System_Architecture/Backend_Architecture.md
- ../05_Frontend/State_Management.md

## Common Interview Questions
1. Constructor vs field injection?
   Constructor injection makes dependencies explicit and final and is easier to test; field injection is less visible, so this project favors constructors.
2. What does `Map<String, PremiumCalculator>` injection do?
   Spring collects every `PremiumCalculator` bean into a map keyed by bean name, enabling runtime lookup without hard-coded wiring.
3. How is a fake injected in tests?
   Construct the service with the same constructor arguments replaced by mocks; no Spring context needed.
4. What is the role of the container here?
   Spring Boot auto-configuration creates the framework beans
   (`ModelMapper`, `PasswordEncoder`, `JavaMailSender`, repositories) and injects them where declared.
5. What does DI look like on the frontend?
   Providers at the root and a single shared `axiosInstance` replace per-component construction; hooks consume them via context and imports.
