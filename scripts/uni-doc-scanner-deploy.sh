#!/bin/bash
# Zero-downtime deployment script using Docker Swarm
# Usage: ./uni-doc-scanner-deploy.sh [new-image-tag]

set -e  # Exit on any error

NEW_IMAGE=$1
if [ -z "$NEW_IMAGE" ]; then
  echo "Error: New image tag not provided"
  echo "Usage: ./uni-doc-scanner-deploy.sh [new-image-tag]"
  exit 1
fi

echo "Deploying new image: $NEW_IMAGE"
# Create the project directory if it doesn't exist
mkdir -p ~/app
cd ~/app

# Create uni-doc-scanner directory in app directory
mkdir -p ~/app/uni-doc-scanner

# Copy .env file from the root directory to app/uni-doc-scanner directory
if [ -f ~/uni-doc-scanner.env ]; then
    echo "Copying .env file from home directory to app/uni-doc-scanner directory..."
    cp ~/uni-doc-scanner.env ~/app/uni-doc-scanner/.env
elif [ -f ../uni-doc-scanner.env ]; then
    echo "Using existing .env file in parent directory..."
    cp ../uni-doc-scanner.env ~/app/uni-doc-scanner/.env
else
    echo "ERROR: No .env file found in ~ or ~/app/ !"
    echo "Please create an .env file with your application's environment variables"
    exit 1
fi

UNI_DOC_SCANNER_BACKEND_SUBDOMAIN="unidocscanner.judiciaryhrm.com"

# # Copy docker-compose.yaml file from the root directory to app directory
# if [ -f ~/docker-compose.yaml ]; then
#     echo "Copying docker-compose.yaml from home directory to app directory..."
#     cp ~/docker-compose.yaml ./
# elif [ -f ../docker-compose.yaml ]; then
#     echo "Using existing docker-compose.yaml file in parent directory..."
#     cp ../docker-compose.yaml ./
# else
#     echo "ERROR: No docker-compose.yaml file found in ~ or ~/app/ !"
#     echo "Please create an docker-compose.yaml file with deployment configuration"
#     exit 1
# fi

# Initialize Docker Swarm if not already initialized
if ! docker info | grep -q "Swarm: active"; then
  echo "Initializing Docker Swarm..."
  docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
fi

echo "About to deploy stack with image: ${NEW_IMAGE}"

# Deploy or update the stack
if docker stack ls | grep -q "app-stack"; then
  echo "Updating existing stack..."
  docker stack deploy -c docker-compose.yaml app-stack --with-registry-auth
else
  echo "Deploying new stack..."
  docker stack deploy -c docker-compose.yaml app-stack --with-registry-auth
fi

# Wait for backend service to be running and available on port 5000
echo "Waiting for backend service to start and be available on port 5000..."

check_service() {
  echo "  Checking service existence..."
  if ! docker service ls | grep -q app-stack_uni-doc-scanner-backend; then
    echo "  Service app-stack_uni-doc-scanner-backend not found"
    return 1
  fi
  
  echo "  Checking service replicas..."
  if ! docker service ls | grep app-stack_uni-doc-scanner-backend | grep -q "1/1"; then
    echo "  Service replicas not ready yet"
    return 1
  fi
  
  echo "  Checking port 8081..."
  if ! timeout 5 bash -c "</dev/tcp/localhost/8081" &>/dev/null; then
    echo "  Port 8081 not accessible"
    return 1
  fi

  echo "  Port 8081 is accessible"
  
  # echo "  Checking health endpoint..."
  # if ! curl -s -f -o /dev/null http://localhost:8081/api/v1/status; then
  #   echo "  Health endpoint not responding"
  #   return 1
  # fi
  
  return 0
}

# Keep checking until service is running or timeout (200 seconds = 4 minutes)
MAX_ATTEMPTS=40
ATTEMPT=1
WAIT_TIME=5  # seconds between attempts

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Checking if backend service is running (attempt $ATTEMPT/$MAX_ATTEMPTS)..."
  
  if check_service; then
    echo "Backend service is now running and available on port 8081!"
    break
  fi
  
  # If this is the first few attempts, show more debugging info
  if [ $ATTEMPT -le 3 ] || [ $(($ATTEMPT % 10)) -eq 0 ]; then
    echo "Service status:"
    docker service ps app-stack_uni-doc-scanner-backend --no-trunc
    echo "Recent logs:"
    docker service logs app-stack_uni-doc-scanner-backend --tail 10
  fi
  
  ATTEMPT=$((ATTEMPT+1))
  
  if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "ERROR: Backend service failed to start within the allocated time."
    echo "Final service status:"
    docker service ps app-stack_uni-doc-scanner-backend --no-trunc
    echo "Detailed container logs:"
    docker service logs app-stack_uni-doc-scanner-backend --tail 100
    echo "Checking if .env file variables are being properly loaded..."
    echo "Number of variables in .env file: $(grep -v '^#' ./.env | grep -v '^$' | wc -l)"
    exit 1
  fi
  
  echo "Waiting for $WAIT_TIME seconds before next check..."
  sleep $WAIT_TIME
done

echo "Deployment successful!"
echo "Your backend application is now available at https://$UNI_DOC_SCANNER_BACKEND_SUBDOMAIN"
