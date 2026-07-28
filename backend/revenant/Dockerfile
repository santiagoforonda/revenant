# ===========================
# Etapa 1: Compilación
# ===========================
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copiar wrapper y pom
COPY .mvn .mvn
COPY mvnw .
COPY pom.xml .

# Dar permisos al wrapper
RUN chmod +x mvnw

# Descargar dependencias
RUN ./mvnw dependency:go-offline

# Copiar código fuente
COPY src src

# Compilar
RUN ./mvnw clean package -DskipTests

# ===========================
# Etapa 2: Ejecución
# ===========================
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]