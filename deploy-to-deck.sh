#!/bin/bash

# Deploy script for Steam Deck
DECK_IP="192.168.0.101"
DECK_USER="deck"
PLUGIN_NAME="game-progress-tracker"

echo "🚀 Deploying Game Progress Tracker to Steam Deck..."

# Build first
echo "📦 Building plugin..."
npm run build

# Create deployment directory
echo "📁 Creating deployment package..."
rm -rf deploy-temp
mkdir -p deploy-temp/$PLUGIN_NAME

# Copy required files
cp -r dist deploy-temp/$PLUGIN_NAME/
cp -r backend deploy-temp/$PLUGIN_NAME/
cp main.py deploy-temp/$PLUGIN_NAME/
cp plugin.json deploy-temp/$PLUGIN_NAME/
cp package.json deploy-temp/$PLUGIN_NAME/
cp requirements.txt deploy-temp/$PLUGIN_NAME/
cp LICENSE deploy-temp/$PLUGIN_NAME/
cp README.md deploy-temp/$PLUGIN_NAME/

echo "📡 Copying to Steam Deck at $DECK_IP..."

# Copy to Steam Deck
scp -r deploy-temp/$PLUGIN_NAME $DECK_USER@$DECK_IP:~/homebrew/plugins/

echo "🔄 Restarting Decky Loader..."
# Restart Decky Loader
ssh $DECK_USER@$DECK_IP "sudo systemctl restart plugin_loader"

# Clean up
rm -rf deploy-temp

echo "✅ Deployment complete!"
echo "🎮 Plugin should reload in a few seconds on your Steam Deck"
echo "📊 Check the monitoring script to see if patches are working"