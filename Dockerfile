FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy full application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

# Start application
CMD ["npm", "start"]
