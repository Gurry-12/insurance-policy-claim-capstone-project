# Multi-stage Docker build for Spring Boot application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application (skip tests during container image build)
RUN mvn clean package -DskipTests

# Production image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the generated JAR file from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose standard port (can be overridden by $PORT env var)
EXPOSE 8081

# Launch the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
