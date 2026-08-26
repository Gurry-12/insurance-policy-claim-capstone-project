# 🔄 State & Activity Diagrams

[⬅️ Back to Diagrams Hub](./README.md)

---

## 1. Claim Adjudication State Machine (Segregation of Duties)

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Customer files claim with PDF/Image evidence
    
    SUBMITTED --> UNDER_REVIEW : Internal Staff moves claim to review
    
    UNDER_REVIEW --> UNDER_REVIEW : Staff assigns claim to self
    
    UNDER_REVIEW --> RECOMMENDED_FOR_APPROVAL : Assigned Staff recommends approval
    UNDER_REVIEW --> RECOMMENDED_FOR_REJECTION : Assigned Staff recommends rejection
    
    RECOMMENDED_FOR_APPROVAL --> APPROVED : Admin grants final approval
    RECOMMENDED_FOR_APPROVAL --> REJECTED : Admin overrides & rejects
    
    RECOMMENDED_FOR_REJECTION --> APPROVED : Admin overrides & approves
    RECOMMENDED_FOR_REJECTION --> REJECTED : Admin confirms rejection
    
    APPROVED --> [*] : Payout authorized (Immutable)
    REJECTED --> [*] : Claim closed (Immutable)
```

---

## 2. Policy Lifecycle State Transitions

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : Customer purchases policy (Quotes rates snapshot)
    
    PENDING_PAYMENT --> ACTIVE : First successful premium payment recorded
    
    ACTIVE --> ACTIVE : Installment payments recorded (within 15-day window)
    
    ACTIVE --> CANCELLED : Admin / Staff cancel policy (Only if NO open claims)
    
    ACTIVE --> EXPIRED : Policy reaches end_date
    
    PENDING_PAYMENT --> CANCELLED : Unpaid policy cancelled
    
    CANCELLED --> [*]
    EXPIRED --> [*]
```

---

## 3. Claim Submission Activity Diagram (Customer Workflow)

```mermaid
flowchart TD
    Start([Customer initiates claim]) --> CheckActive{Is Policy ACTIVE?}
    CheckActive -- No --> Err1[Throw BadRequestException: Policy Inactive]
    CheckActive -- Yes --> CalcRemaining[Calculate remaining coverage: selectedCoverage - activeClaimsSum]
    CalcRemaining --> CheckAmount{claimAmount <= remainingCoverage?}
    CheckAmount -- No --> Err2[Throw BadRequestException: Exceeds Coverage Limit]
    CheckAmount -- Yes --> CheckDate{incidentDate within policy start & end dates?}
    CheckDate -- No --> Err3[Throw BadRequestException: Incident Date Out of Bounds]
    CheckDate -- Yes --> CheckFiles{Attached files valid PDF/Image and <= 5MB?}
    CheckFiles -- No --> Err4[Throw BadRequestException: Invalid File Size/Type]
    CheckFiles -- Yes --> UploadCloud[Upload files to Cloudinary CDN]
    UploadCloud --> SaveClaim[Save Claim as SUBMITTED]
    SaveClaim --> SaveDocs[Save ClaimDocument records]
    SaveDocs --> LogAudit[Insert initial audit entry in ClaimStatusHistory]
    LogAudit --> Success([Return 201 Created to Customer])
```
