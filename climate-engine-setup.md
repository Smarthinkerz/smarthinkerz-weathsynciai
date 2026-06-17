# Climate Engine API Setup Guide

## What You Need:
1. Climate Engine API key from Google Cloud Marketplace
2. Google Cloud Project with billing enabled

## Simplified Setup Steps:

### Step 1: Get API Access
1. Go to: https://console.cloud.google.com/marketplace/product/climate-engine/climate-engine
2. Click "Enable" 
3. Select your Google Cloud project (or create one)
4. Enable billing if prompted

### Step 2: Get API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Restrict the key to "Climate Engine API" for security

### Step 3: Add to WealthSync
Add the API key as environment secret: `CLIMATE_ENGINE_API_KEY`

## What We'll Use It For:
- Geographic market intelligence
- Regional business risk assessment
- Location-based market analysis
- Environmental factors in market reports

## Alternative Options:
If Google Cloud is too complex, we can:
1. Use existing World Bank + Alpha Vantage APIs
2. Focus on manual market research verification
3. Explore simpler geographic APIs

Would you like me to help with the Google Cloud setup, or explore alternative approaches?