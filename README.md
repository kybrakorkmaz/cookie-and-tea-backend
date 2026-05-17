# cookie-and-tea-backend

## Development — Running database migrations

The project uses Docker Compose for local development and a `postgres` service. To avoid connecting to a host Postgres instance (which often runs on `localhost`), run migrations inside the app container so the service connects via the Docker network.

Recommended (works when containers are running):

```powershell
# Start the compose stack (if not already running)
npm run docker:up

# Run migrations using the helper script (recommended)
npm run docker:db:migrate
# or using docker compose exec (requires running service name 'api')
npm run docker:db:migrate:exec
```

Notes:
- `npm run db:migrate` runs the migration command on your host. If you have a local Postgres service on your host that listens on `localhost:5432`, this may accidentally connect to that Postgres instance instead of the Docker one and cause authentication errors.
- We set `IN_DOCKER=1` for the `api` service in `docker-compose.dev.yml`; the migration script uses this to rewrite `@localhost:` URLs to the Docker service alias `@postgres:` when running inside the container.

If you prefer host-level migrations, ensure your host Postgres credentials match `DATABASE_URL` or stop the host Postgres service before running `npm run db:migrate`.

## Running tests inside Docker (recommended)

To run test database and test suite inside Docker (keeps host environment isolated):

```powershell
# Bring up the dedicated test compose stack (uses .env.test and launches cat_test API container)
npm run docker:test:up

# Run the migrations against test database inside the test api container
npm run docker:test:migrate

# Run the test suite inside the container
npm run docker:test:run

# Tear down the test stack
npm run docker:test:down
```

This creates an isolated `cat_test` Postgres instance (host port 5433) and an `api` container that uses `.env.test` so tests run against the containerized test database.
