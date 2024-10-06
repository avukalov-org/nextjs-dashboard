# Use the official Node.js image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]



# Set environment variables for Hasura, Auth0, and Postgres
# ENV NEXT_PUBLIC_HASURA_WS=${NEXT_PUBLIC_HASURA_WS}
# ENV HASURA_SECRET=${HASURA_SECRET}
# ENV HASURA_URL=${HASURA_URL}
# ENV AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
# ENV AUTH0_BASE_URL=${AUTH0_BASE_URL}
# ENV AUTH0_SECRET=${AUTH0_SECRET}
# ENV AUTH0_ISSUER_BASE_URL=${AUTH0_ISSUER_BASE_URL}
# ENV AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
# ENV AUTH0_CLIENT_SECRET=${AUTH0_CLIENT_SECRET}
# ENV AUTH_SECRET=${AUTH_SECRET}
# ENV POSTGRES_URL=${POSTGRES_URL}
# ENV POSTGRES_URL_NON_POOLING=${POSTGRES_URL_NON_POOLING}
# ENV POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL}
# ENV POSTGRES_USER=${POSTGRES_USER}
# ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
# ENV POSTGRES_HOST=${POSTGRES_HOST}
# ENV POSTGRES_DATABASE=${POSTGRES_DATABASE}