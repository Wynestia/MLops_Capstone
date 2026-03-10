#!/bin/bash
# Deployment helper script
# Usage: ./deploy.sh <external-ip>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <your-vm-external-ip>"
    echo "Example: ./deploy.sh 35.123.45.67"
    exit 1
fi

VM_IP=$1
BACKEND_PATH="backend"

echo "🚀 Deploying PawMind to Google Cloud"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Build frontend
echo ""
echo "📦 Building frontend..."
npm run build
echo "✅ Frontend built successfully"

# Step 2: Update CORS in .env.production
echo ""
echo "⚙️  Updating CORS settings..."
ESCAPED_IP=$(echo "$VM_IP" | sed 's/\./\\./g')
sed -i.bak "s/XXX_YOUR_VM_PUBLIC_IP_XXX/$VM_IP/g" "$BACKEND_PATH/.env.production"
echo "✅ CORS updated with IP: $VM_IP"

# Step 3: Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git add .
git commit -m "chore: update deployment configuration for IP $VM_IP" || true
git push origin main
echo "✅ Pushed to GitHub"

# Step 4: Upload .env.production
echo ""
echo "📝 Uploading .env.production to VM..."
scp "$BACKEND_PATH/.env.production" "$VM_IP:~/MLops_Capstone/backend/"
echo "✅ Environment file uploaded"

# Step 5: Deploy containers
echo ""
echo "🐳 Starting Docker containers on VM..."
ssh "$VM_IP" << 'EOSSH'
cd ~/MLops_Capstone/backend
docker-compose -f docker-compose.prod.yml up -d
echo "Waiting for services to start..."
sleep 10
docker-compose -f docker-compose.prod.yml ps
EOSSH
echo "✅ Containers started"

# Step 6: Verify deployment
echo ""
echo "✔️  Verifying deployment..."
if curl -s "http://$VM_IP:8000/health" > /dev/null; then
    echo "✅ API is responding"
else
    echo "⚠️  API not responding yet, check logs with:"
    echo "   ssh $VM_IP 'docker-compose -f docker-compose.prod.yml logs api'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment complete!"
echo ""
echo "Access your app:"
echo "  🌐 Web: http://$VM_IP"
echo "  📚 API Docs: http://$VM_IP:8000/docs"
echo ""
echo "Useful commands:"
echo "  ssh $VM_IP 'docker-compose -f docker-compose.prod.yml logs -f api'"
echo "  ssh $VM_IP 'docker-compose -f docker-compose.prod.yml ps'"
