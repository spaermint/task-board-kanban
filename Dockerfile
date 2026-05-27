# Use the official Bun image
FROM oven/bun:1 AS build

WORKDIR /app

# Install backend dependencies
COPY package.json bun.lock ./
RUN bun install

# Install frontend dependencies and build
COPY frontend/package.json frontend/bun.lock frontend/
RUN cd frontend && bun install

# Copy all source files
COPY . .

# Build the frontend
RUN cd frontend && bun run build

# Final production image
FROM oven/bun:1 AS production

WORKDIR /app

# Copy only what we need from the build stage
COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/frontend/dist ./frontend/dist

# Expose the port Railway will use
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]