FROM node:24-alpine

WORKDIR /usr/src/app

COPY .npmrc package*.json ./

RUN npm ci

# Copy the rest of the source code.
COPY . .

# Build the project (assuming tsc is configured to output to the 'dist' folder)
RUN npm run build

# Start the application.
CMD ["npm", "start"]
