#!/bin/bash

# Production script for Cookie and Tea Backend
# Usage: ./prod.sh [up|down|logs|restart|ps]

COMMAND=${1:-up}
PROJECT_NAME="cat-prod"
COMPOSE_FILE="docker-compose.prod.yml"

# Load .env.production if exists
if [ -f .env.production ]; then
  echo "Loading production environment variables safely..."
  while IFS= read -r line || [ -n "$line" ]; do
    # Strip carriage returns first (Windows/CRLF fix)
    clean_line=$(echo "$line" | sed 's/\r$//')

    # Skip comments and lines that are completely empty
    [[ "$clean_line" =~ ^#.*$ ]] || [ -z "$clean_line" ] && continue

    # Export valid configurations securely
    export "$clean_line"
  done < .env.production
fi

case $COMMAND in
  up)
    echo "Starting production environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    echo "Production environment is up."
    echo "API is available at http://localhost:${API_PORT:-8000}"
    ;;
  down)
    echo "Stopping production environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE down "${@:2}"
    ;;
  logs)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f "${@:2}"
    ;;
  restart)
    echo "Restarting production environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE restart "${@:2}"
    ;;
  ps)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE ps
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [up|down|logs|restart|ps]"
    exit 1
    ;;
esac