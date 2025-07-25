# --- base stage: Python + Node
FROM python:3.11-slim AS base

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install system deps
RUN apt-get update && \
    apt-get install -y curl gnupg build-essential git python3-venv && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy app files
COPY requirements.txt .
COPY policy-gui-be/ policy-gui-be/
COPY policy-gui-fe/ policy-gui-fe/

# Python: venv and install
RUN python3 -m venv $VIRTUAL_ENV && \
    $VIRTUAL_ENV/bin/pip install --upgrade pip setuptools wheel uvicorn && \
    $VIRTUAL_ENV/bin/pip install -r requirements.txt && \
    git clone https://github.com/AnyLog-co/AnyLog-API

# Install AnyLog-API
WORKDIR /app/AnyLog-API
RUN $VIRTUAL_ENV/bin/python setup.py sdist bdist_wheel && \
    $VIRTUAL_ENV/bin/pip install --upgrade dist/*.whl

# Build frontend
WORKDIR /app/policy-gui-fe
RUN npm install && npm run build

# --- final deployment stage
FROM python:3.11-slim AS deployment

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV CLI_IP=0.0.0.0
ENV CLI_PORT=8000

# Install serve for frontend and curl for health checks
RUN apt-get update && \
    apt-get install -y nodejs npm xsel curl && \
    npm install -g serve && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built app and venv
COPY --from=base /opt/venv /opt/venv
COPY --from=base /app/policy-gui-be /app
COPY --from=base /app/policy-gui-fe/build /app/policy-gui-fe/build
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8000 3001

CMD ["/app/start.sh"]