# ==========================
# Etapa 1 - Compilación
# ==========================
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copiar archivos de Maven
COPY .mvn .mvn
COPY mvnw .
COPY pom.xml .

# Permiso de ejecución al wrapper
RUN chmod +x mvnw

# Descargar dependencias
RUN ./mvnw dependency:go-offline

# Copiar el código fuente
COPY src src

# Compilar la aplicación
RUN ./mvnw clean package -DskipTests

# ==========================
# Etapa 2 - Runtime
# ==========================
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "app.jar"]