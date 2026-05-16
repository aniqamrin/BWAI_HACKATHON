#!/bin/bash
# EcosystemOS AI - Google Cloud Deployment Script
set -e

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-gcp-project-id"}
REGION=${VERTEX_AI_LOCATION:-"us-central1"}
BACKEND_IMAGE="gcr.io/$PROJECT_ID/ecosystemos-backend"
FRONTEND_IMAGE="gcr.io/$PROJECT_ID/ecosystemos-frontend"

echo "🚀 Deploying EcosystemOS AI to Google Cloud..."
echo "   Project: $PROJECT_ID"
echo "   Region:  $REGION"

# Authenticate
gcloud config set project $PROJECT_ID

# ── Backend ──────────────────────────────────────────────────
echo ""
echo "📦 Building and pushing backend..."
gcloud builds submit --tag $BACKEND_IMAGE ./backend

echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy ecosystemos-backend \
  --image $BACKEND_IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 4000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=$DATABASE_URL" \
  --set-env-vars "JWT_SECRET=$JWT_SECRET" \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-env-vars "VERTEX_AI_LOCATION=$REGION"

BACKEND_URL=$(gcloud run services describe ecosystemos-backend --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# ── Frontend ─────────────────────────────────────────────────
echo ""
echo "📦 Building and pushing frontend..."
gcloud builds submit \
  --tag $FRONTEND_IMAGE \
  --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL \
  ./frontend

echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy ecosystemos-frontend \
  --image $FRONTEND_IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL"

FRONTEND_URL=$(gcloud run services describe ecosystemos-frontend --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"

echo ""
echo "🎉 Deployment complete!"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   Health:   $BACKEND_URL/health"
