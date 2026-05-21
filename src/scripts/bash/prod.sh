#!/bin/bash

# Production script for Cookie and Tea Backend
# Usage: ./prod.sh [up|down|logs|restart|ps]

COMMAND=${1:-up}
PROJECT_NAME="cat-prod"
COMPOSE_FILE="docker-compose.prod.yml"

# Load .env.production if exists
if [ -f .env.production ]; then
  # Use sed to remove carriage returns and export variables safely
  export $(grep -v '^#' .env.production | sed 's/\r$//' | xargs)
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
