FROM node:18.19.1-buster

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Chromium
RUN apt-get update \
  && apt-get install -y chromium \
  && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code to the working directory
COPY . .

# Install dependencies
RUN npm install

# Expose the port that the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "run", "start"]
