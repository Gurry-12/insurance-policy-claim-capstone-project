# Build

> How to build backend and frontend artifacts, and how to run the tests.

## Purpose

Reproducible builds of both modules.

## Backend

```bash
cd insurance-policy-claim-management-system

# Full build (runs tests)
./mvnw clean package

# Skip tests for a fast build
./mvnw clean package -DskipTests

# Run only the tests
./mvnw test
```

Artifact: `target/insurance-policy-claim-management-system-0.0.1-SNAPSHOT.jar`
(a Spring Boot fat jar with embedded Tomcat).

### Tests

- `src/test/java/com/insurance/demo/JwtSecurityIntegrationTest.java` — JWT auth
  end-to-end (login → authenticated request, invalid/expired token handling).
- `src/test/java/com/insurance/demo/RefreshTokenIntegrationTest.java` — refresh
  rotation, reuse detection / family revocation, logout.
- Test profile `src/test/resources/application-test.properties`; tests use
  `@SpringBootTest` + Spring Test support. They expect a reachable MySQL (same
  `env.properties` credentials).

## Frontend

```bash
cd insurance-policy-claim-management-app-ui

npm install
npm run build          # production build to dist/
npm run lint           # ESLint
```

Artifact: `dist/` — static assets served by any web server (Vite emits hashed
filenames, CSP via `.env.production`).

### Previewing the production build

```bash
npm run preview
```

## CI notes

- `npm ci` instead of `npm install` for reproducible frontend installs.
- Maven wrapper pins the Maven version; CI should use `./mvnw`.
- Both modules are independent; build frontend → serve statically, build
  backend → run as a service (see `Deployment.md`).

## Related

- `Run.md` — running locally
- `Deployment.md` — production deployment
- `../00_Project_Overview/Tech_Stack.md` — versions
