# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build the React application (for production, you might use `npm run build` and serve statically)
RUN npm run build

# Command to run your app using the development server
CMD ["npm", "start"]
