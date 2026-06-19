#!/bin/bash

# Test script for Cookie and Tea Backend
COMMAND=${1:-run}
PROJECT_NAME="cat-test"
COMPOSE_FILE="docker-compose.test.yml"

# 1. Load .env.test if exists safely
if [ -f ".env.test" ]; then
  echo "Loading test environment variables safely..."
  while IFS= read -r line || [ -n "$line" ]; do
    # Clean Windows carriage returns (\r)
    clean_line=$(echo "$line" | sed 's/\r$//')

    # Skip line if empty or if it contains an indented comment block
    [[ -z "$clean_line" || "$clean_line" =~ ^[[:space:]]*# ]] && continue

    # Trim leading/trailing whitespace around the key=value assignment pairs
    clean_line=$(echo "$clean_line" | xargs)

    # Export key-value segments explicitly safely splitting them
    key=$(echo "$clean_line" | cut -d '=' -f 1)
    value=$(echo "$clean_line" | cut -d '=' -f 2-)
    export "$key=$value"
  done < .env.test
fi

# Helper function to wait for the database to be healthy
wait_for_db() {
  local db_user=${POSTGRES_USER:-postgres}
  echo "Waiting for PostgreSQL to be ready (User: $db_user)..."

  # Timeout after 30 seconds max
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
  clean)
    echo "--- Executing Explicit Raw Infrastructure Purge ---"
    # Force kill and remove your exact target container names safely
    docker rm -f cat_test_api cat_test_postgres cat_test_pgadmin >/dev/null 2>&1 || true

    # Force remove your exact bridge network name safely
    docker network rm cat-test_cat-test-network >/dev/null 2>&1 || true

    # Force remove your exact database named data volume volume safely
    docker volume rm cat-test_postgres_test_data >/dev/null 2>&1 || true

    # Removed "docker volume prune -f" to protect unrelated host volumes from data loss
    echo "Environment cleanup finalized successfully."
    ;;

  run)
    echo "Starting full test suite pipeline..."

    # Call your standalone clean block internally first to guarantee fresh slate
    $0 clean

    # Define a fail-safe execution exit hook for the current run cycle
    cleanup_pipeline() {
      echo -e "\n--- Test Suite Cycle Ended. Initiating Self-Healing Environment Clean ---"
      $0 clean
    }
    trap cleanup_pipeline EXIT INT TERM

    # Bring up isolated test infrastructure components
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build

    # Block execution until database availability checks respond
    wait_for_db

    #  Fail fast pattern implementation for schema changes
    echo "Applying runtime scheme migrations..."
    if ! $0 migrate; then
        echo "CRITICAL ERROR: Database migration failed. Aborting test execution pipeline." >&2
        exit 1
    fi

    echo "Seeding test database..."
    if ! $0 seed; then
        echo "WARNING: Database seeding failed. Continuing to tests anyway..." >&2
    fi

    echo "Executing tests..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T api npm test
    RESULT=$?

    # Pass the actual exit code returned by Jest back out to npm
    exit $RESULT
    ;;

  up)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    ;;

  down)
    echo "Stopping test environment..."
    $0 clean
    ;;

  migrate)
    echo "Running migrations..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T api npm run db:migrate:test
    ;;

  seed)
    echo "Running seed..."
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T api npm run db:seed:test
    ;;

  logs)
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f "${@:2}"
    ;;

  *)
    echo "Usage: $0 [run|clean|up|down|migrate|logs]"
    exit 1
    ;;
esac