#!/bin/bash
set -e

echo "=== Short Drama Player - Deployment Script ==="

# Build backend Docker image
echo "Building backend Docker image..."
cd backend
docker build -t drama-backend:latest .
cd ..

# Deploy with docker-compose (local development)
echo "Starting services with docker-compose..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 10

# Check health
echo "Checking service health..."
docker-compose ps

echo ""
echo "=== Deployment Complete ==="
echo "Backend API: http://localhost:8080"
echo "MySQL: localhost:3306"
echo "Redis: localhost:6379"
echo ""
echo "API Endpoints:"
echo "  GET  /api/drama/recommend  - Recommended dramas"
echo "  GET  /api/drama/hot        - Hot dramas"
echo "  GET  /api/drama/{id}/detail - Drama detail"
echo "  GET  /api/episode/{id}/playinfo - Episode play info"
echo "  POST /api/interaction/answer - Submit interaction answer"
echo "  GET  /api/interaction/{id}/stats - Interaction statistics"
echo "  POST /api/progress/report  - Report watch progress"
