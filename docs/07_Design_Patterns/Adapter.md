> Bridging external APIs and incompatible interfaces.

---

## Purpose
Explains how the Adapter Pattern is utilized to wrap external SDKs (Cloudinary, Twilio, Email) and mapping libraries (ModelMapper) so they conform to our application's internal expectations.

---

## Overview
- Wraps third-party libraries to prevent vendor lock-in.
- Maps internal Domain Entities to external DTOs.
- Simplifies complex third-party APIs into domain-specific methods.

---

## Business Context
We use Cloudinary for document storage and Twilio for SMS. If Cloudinary changes their SDK in a version update, or if we decide to switch to AWS S3, we do not want to rewrite 50 different service classes. We only want to rewrite one adapter.

> **Analogy**: Like using a travel power adapter in Europe. The wall socket (external API) expects two round pins, but your laptop (internal service) has three flat pins. The adapter sits in the middle and translates the connection.

---

## System Flow

```mermaid
flowchart LR
    A[ClaimService] -->|upload(file)| B[CloudinaryAdapter]
    B -->|SDK logic| C[(Cloudinary Cloud)]
    C -->|Response URL| B
    B -->|Return simple String| A
```

---

## Backend Implementation

### Where Adapter is Used
1. **ModelMapper**: Adapts database Entities to Frontend DTOs.
2. **Cloudinary**: Wraps the complex `cloudinary.uploader().upload()` method into a simple `String uploadFile(MultipartFile)` interface.
3. **Notification Services**: Wraps Twilio and JavaMailSender into a unified `NotificationAdapter` interface.

---

## Design Decisions
- **Why Adapter for external services?**  
  Vendor lock-in is a massive risk. By defining our own interface (`FileStoragePort`) and implementing it with `CloudinaryAdapter`, the core business logic depends on an abstraction we control, not a 3rd party class. This is the essence of the Hexagonal Architecture (Ports and Adapters).

---

## Interview Notes
1. **Why wrap ModelMapper instead of using it directly?**  
   If we want to switch to MapStruct for performance reasons later, we only change the adapter layer, not every controller in the system.
2. **What is the difference between Adapter and Facade?**  
   Adapter makes two incompatible interfaces work together. Facade simplifies a complex subsystem into a single, simpler interface. Our Cloudinary wrapper arguably acts as both.
3. **How does this help testing?**  
   We can easily mock the Adapter interface in our unit tests, rather than trying to mock the complex, often static or final classes of an external SDK.

---

## Code References
| Component | Path |
|-----------|------|
| Document Adapter | `com.insurance.demo.adapter.CloudinaryAdapter` |
| Notification Adapter | `com.insurance.demo.adapter.SmsAdapter` |

---

## Related Documents
- `../07_Design_Patterns/Dependency_Injection.md`
