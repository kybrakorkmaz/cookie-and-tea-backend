#!/bin/bash

# Development script for Cookie and Tea Backend
# Usage: ./dev.sh [up|down|logs|migrate|restart|ps]

COMMAND=${1:-up}
PROJECT_NAME="cat-dev"
COMPOSE_FILE="docker-compose.dev.yml"

# Load .env if exists
if [ -f .env ]; then
  echo "Loading environment variables safely..."
  while IFS= read -r line || [ -n "$line" ]; do
    # Clean Windows carriage returns
    clean_line=$(echo "$line" | sed 's/\r$//')

    [[ -z "$clean_line" || "$clean_line" =~ ^[[:space:]]*# ]] && continue

    clean_line=$(echo "$clean_line" | xargs)

    key=$(echo "$clean_line" | cut -d '=' -f 1)
    value=$(echo "$clean_line" | cut -d '=' -f 2-)
    export "$key=$value"
  done < .env
fi

case $COMMAND in
  up)
    echo "Starting development environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    echo "Development environment is up."
    echo "API: http://localhost:${API_PORT:-8003}"
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
    echo "Hard-cycling development environment..."
    # Drop the container and its anonymous tracking volumes
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE down
    # Force a fresh runtime recreation tracking live hard-drive modifications
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --force-recreate "${@:2}"
    echo "Environment hard-recreated successfully."
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