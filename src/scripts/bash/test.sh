#!/bin/bash

# Test script for Cookie and Tea Backend
COMMAND=${1:-run}
PROJECT_NAME="cat-test"
COMPOSE_FILE="docker-compose.test.yml"

# Load .env.test if exists
if [ -f .env.test ]; then
  echo "Loading test environment variables..."
  while IFS= read -r line || [ -n "$line" ]; do
    clean_line=$(echo "$line" | sed 's/\r$//')
    [[ "$clean_line" =~ ^#.*$ ]] || [ -z "$clean_line" ] && continue
    export "$clean_line"
  done < .env.test
fi

# Helper function to wait for the database to be healthy
wait_for_db() {
  # Ensure POSTGRES_USER is set, default to "postgres" if missing
  local db_user=${POSTGRES_USER:-postgres}
  echo "Waiting for PostgreSQL to be ready (User: $db_user)..."

  # Timeout after 30 seconds
  for i in {1..10}; do
    if docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T postgres pg_isready -U "$db_user" >/dev/null 2>&1; then
      echo "Database is ready!"
      return 0
    fi
    echo "Waiting for DB... ($i/10)"
    sleep 3
  done

  echo "Error: Database failed to start in time (Check if POSTGRES_USER='$db_user' is correct)."
  exit 1
}

case $COMMAND in
  run)
    echo "Starting full test suite pipeline..."
    $0 up

    # Setup cleanup trap
    cleanup() {
      echo -e "\nInterrupt received, cleaning up..."
      $0 down
      exit 1
    }
    trap cleanup INT TERM

    wait_for_db
    $0 migrate

    echo "Executing tests..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T api npm test
    RESULT=$?

    trap - INT TERM
    $0 down
    exit $RESULT
    ;;
  up)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    ;;
  down)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE down -v "${@:2}"
    ;;
  migrate)
    echo "Running migrations..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T api npm run db:migrate:test
    ;;
  logs)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f "${@:2}"
    ;;
  *)
    echo "Usage: $0 [run|up|down|migrate|logs]"
    exit 1
    ;;
esac