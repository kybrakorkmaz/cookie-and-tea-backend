#!/bin/bash

# Development script for Cookie and Tea Backend
# Usage: ./dev.sh [up|down|logs|migrate|restart|ps]

COMMAND=${1:-up}
PROJECT_NAME="cat-dev"
COMPOSE_FILE="docker-compose.dev.yml"

# Load .env if exists
if [ -f .env ]; then
  # Use sed to remove carriage returns and export variables safely
  export $(grep -v '^#' .env | sed 's/\r$//' | xargs)
fi

case $COMMAND in
  up)
    echo "Starting development environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    echo "Development environment is up."
    echo "API: http://localhost:${API_PORT:-8000}"
    echo "pgAdmin: http://localhost:${PGADMIN_PORT:-5050}"
    ;;
  down)
    echo "Stopping development environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE down "${@:2}"
    ;;
  logs)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f "${@:2}"
    ;;
  migrate)
    echo "Running migrations in development container..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec api npm run db:migrate
    ;;
  restart)
    echo "Restarting development environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE restart "${@:2}"
    ;;
  ps)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE ps
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [up|down|logs|migrate|restart|ps]"
    exit 1
    ;;
esac
