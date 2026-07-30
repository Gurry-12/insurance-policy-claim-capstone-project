# Admin Login Work flow 

---

### diagram

```mermaid

flowchart TD

    A([Start])
    B[/Enter Email & Password/]
    C[Validate credentials]
    D[(users table)]
    E{Valid Admin?}
    F[Generate JWT Token]
    G[/Access granted — Admin Dashboard/]
    H[/Error: Invalid credentials/]

    A --> B
    B --> C
    C --> D
    D --> E
    E -- Yes --> F
    F --> G
    E -- No --> H
    H --> B
    
 ```