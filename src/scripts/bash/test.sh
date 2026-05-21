#!/bin/bash

# Test script for Cookie and Tea Backend
# Usage: ./test.sh [run|up|down|migrate|logs]

COMMAND=${1:-run}
PROJECT_NAME="cat-test"
COMPOSE_FILE="docker-compose.test.yml"

# Load .env.test if exists
if [ -f .env.test ]; then
  # Use sed to remove carriage returns and export variables safely
  export $(grep -v '^#' .env.test | sed 's/\r$//' | xargs)
fi

case $COMMAND in
  run)
    echo "Running full test suite in Docker..."
    $0 up
    $0 migrate
    echo "Executing tests..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec api npm test
    RESULT=$?
    $0 down
    exit $RESULT
    ;;
  up)
    echo "Starting test environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    ;;
  down)
    echo "Cleaning up test environment..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE down -v "${@:2}"
    ;;
  migrate)
    echo "Waiting for database and running migrations..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec api npm run db:migrate:test
    ;;
  logs)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f "${@:2}"
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [run|up|down|migrate|logs]"
    exit 1
    ;;
esac
