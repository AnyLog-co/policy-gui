#!/bin/bash

# Set a default if not passed
export REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:8000}

echo "Starting Policy GUI with API URL: $REACT_APP_API_URL"

# Inject the runtime API URL into config.js if template exists
CONFIG_PATH="/app/policy-gui-fe/public/config.js"
TEMPLATE_PATH="/app/policy-gui-fe/public/config.template.js"
if [ -f "$TEMPLATE_PATH" ]; then
    echo "Configuring frontend with API URL..."
    sed "s|__REACT_APP_API_URL__|$REACT_APP_API_URL|g" "$TEMPLATE_PATH" > "$CONFIG_PATH"
else
    echo "Warning: config.template.js not found"
fi

# Start backend first
cd /app
echo "Starting backend server..."
$VIRTUAL_ENV/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    echo "Waiting for backend... (attempt $i/30)"
    sleep 2
done

# Check if backend is actually running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "ERROR: Backend failed to start properly"
    exit 1
fi

# Start frontend
echo "Starting frontend server..."
serve -s /app/policy-gui-fe/build -l 3001