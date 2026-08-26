# Build Guide
> Compiling and packaging the InsuranceFlow system for deployment.

---

## Purpose
Instructions for compiling source code into deployable artifacts (JAR files for backend, static HTML/JS for frontend).

---

## Backend Build (Maven)

The backend is packaged as an executable Spring Boot fat JAR containing all dependencies and an embedded Tomcat server.

### Commands

| Command | What it does |
|---------|--------------|
| `mvn clean` | Deletes the `/target` directory to ensure a fresh build. |
| `mvn compile` | Compiles Java source files into `.class` files. |
| `mvn test` | Runs all JUnit and Mockito tests. |
| `mvn clean install -DskipTests` | Cleans, compiles, and packages into a `.jar`, skipping tests for speed. |

### Build Artifact
- **Location:** `./target/insuranceflow-0.0.1-SNAPSHOT.jar`
- **Run the artifact:** `java -jar target/insuranceflow-0.0.1-SNAPSHOT.jar`

---

## Frontend Build (npm / Vite)

The frontend is compiled using Vite into heavily optimized static assets (HTML, CSS, JS) suitable for hosting on Nginx, Apache, or CDN.

### Commands

| Command | What it does |
|---------|--------------|
| `npm run build` | Compiles React code, transpiles modern JS, and bundles assets via Vite. |
| `npm run preview` | Boots a local static server to test the production build before deployment. |

### Build Artifact
- **Location:** `./dist/` directory.
- This folder contains `index.html` and an `/assets` folder with minified chunks.
- **Note:** You cannot simply open `index.html` in a browser via `file://`. It must be served over HTTP.

---

> [!IMPORTANT]
> **Environment Variables during Build**
> The frontend `npm run build` command bakes `VITE_` prefixed environment variables directly into the static JS files. Ensure your `.env.production` is set correctly *before* building.

---

## Related Documents
- [Deployment Guide](./Deployment.md)
- [Environment Configuration](./Environment.md)
