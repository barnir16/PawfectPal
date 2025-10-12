#!/bin/bash

# Set proper headers for Firebase service worker
export NODE_ENV=production

# Start the server with proper configuration
npx serve -s dist -l 8080 --single
