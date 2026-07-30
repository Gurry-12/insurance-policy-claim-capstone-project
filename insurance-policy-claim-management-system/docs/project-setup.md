\# Local Project Setup Guide



\## Prerequisites



Install the following software before setting up the project:



\* Java 17

\* Maven 3.9+

\* MySQL 8+

\* Git

\* STS / IntelliJ IDEA

\* Postman



Verify installation:



```bash

java --version

mvn --version

git --version

```



\---



\# Clone Repository



Clone the project from GitHub:



```bash

git clone https://github.com/Gurry-12/insurance-policy-claim-management-system.git

```



Move into the project directory:



```bash

cd insurance-policy-claim-management-system

```



\---



\# Branch Setup



Fetch latest branches:



```bash

git fetch origin

```



Switch to develop branch:



```bash

git checkout develop

```



Pull latest changes:



```bash

git pull origin develop

```



\---



\# Create Your Feature Branch



Never work directly on main or develop.



Create a feature branch:



```bash

git checkout develop

git pull origin develop

git checkout -b feature/<your-module-name>

```



Examples:



```bash

git checkout -b feature/auth-security

git checkout -b feature/customer-module

git checkout -b feature/product-module

```



Push branch:



```bash

git push -u origin feature/<your-module-name>

```



\---



\# Database Setup



Create a database:



```sql

CREATE DATABASE insurance\_db;

```



Update application.properties:



```properties

spring.datasource.url=jdbc:mysql://localhost:3306/insurance\_db

spring.datasource.username=YOUR\_USERNAME

spring.datasource.password=YOUR\_PASSWORD

```



Do not commit personal database credentials.



\---



\# Build Project



Clean and build:



```bash

mvn clean install

```



Run application:



```bash

mvn spring-boot:run

```



Or run from STS/IntelliJ.



\---



\# Verify Application



Swagger UI:



```text

http://localhost:8080/swagger-ui/index.html

```



Application Health Check:



```text

http://localhost:8080

```



\---



\# Git Workflow



Before starting work:



```bash

git checkout develop

git pull origin develop

git checkout feature/<your-module-name>

```



Commit changes:



```bash

git add .

git commit -m "feat: add customer registration API"

```



Push changes:



```bash

git push origin feature/<your-module-name>

```



Create a Pull Request to:



```text

feature branch -> develop

```



\---



\# Team Rules



1\. Do not push directly to main.

2\. Do not commit database credentials.

3\. Do not commit target folder.

4\. Do not work on another member's feature branch.

5\. Pull latest develop branch before starting work.

6\. Raise Pull Requests for all completed features.



\---



\# Team Members



\* Gurpreet Singh

\* Chandrashekhar

\* Shivaji



