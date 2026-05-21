# cookie-and-tea-backend

Creator support app like Buy Me a Coffee or Ko-fi.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)
- Bash-compatible environment (Git Bash, WSL, or Linux/macOS)

## Environment Management

This project uses coordinated bash scripts and `package.json` scripts to manage different environments (Development, Test, Production).

### Bash Scripts
The core logic resides in `src/scripts/bash/`:
- `dev.sh`: Manages the development stack.
- `test.sh`: Manages the test environment and runs tests.
- `prod.sh`: Manages the production stack.

Usage: `bash src/scripts/bash/<script>.sh [command]`

### Script Command Matrix

| Command   | `dev.sh` | `test.sh` | `prod.sh` | Notes |
|-----------|:--------:|:---------:|:---------:|-------|
| `up`      | ✓        | ✓         | ✓         | Starts the environment. |
| `down`    | ✓        | ✓         | ✓         | Stops and removes containers. |
| `logs`    | ✓        | ✓         | ✓         | Follows container logs. |
| `migrate` | ✓        | ✓         | -         | Runs migrations in the container. |
| `run`     | -        | ✓         | -         | Full cycle: up → migrate → test → down. |
| `restart` | ✓        | -         | -         | Restarts development containers. |
| `ps`      | ✓        | -         | ✓         | Lists container status. |
| `-v` flag | ✓        | ✓         | ✓         | Can be added to `down` to remove volumes. |

---

## Development

The development environment uses `docker-compose.dev.yml` and includes the API, a Postgres database, and pgAdmin.

```bash
# Start the development environment
npm run docker:up

# Run database migrations
npm run docker:migrate

# View logs
npm run docker:logs

# Stop the environment
npm run docker:down

# Stop and remove volumes (reset database)
npm run docker:down:v
```

- **API:** http://localhost:8000
- **pgAdmin:** http://localhost:5050 (Credentials in `.env`)
- **Database (Internal):** Port 5432
- **Database (External):** Port 5434 (mapped to avoid conflicts with local Postgres)

---

## Testing

Tests are executed in an isolated Docker environment to ensure consistency.

```bash
# Run the full test suite (up -> migrate -> test -> down)
npm run test:docker

# Manual control:
npm run test:docker:up      # Start test containers
npm run test:docker:migrate # Run migrations on test DB
npm run test:docker:watch   # Run tests in watch mode (requires test:docker:up first)
npm run test:docker:down    # Stop and clean up test containers
```

### Harmonious Workflow

You can run both development and test environments at the same time:
- **Dev Stack** (Port 8000, DB 5434)
- **Test Stack** (Port 8001, DB 5435)

This allows you to implement features in the dev environment and immediately run tests against the test environment without context switching or stopping containers.

---

## Production

The production configuration uses `docker-compose.prod.yml` and builds the production target of the Dockerfile.

```bash
# Start production environment
npm run prod:up

# Stop production environment
npm run prod:down

# View production logs
npm run prod:logs
```

## Local Development (Non-Docker)

If you prefer to run the Node.js server directly on your host:

```bash
npm install
npm run db:migrate
npm run dev
```
*Note: Ensure a Postgres instance is running and `DATABASE_URL` is correctly configured in `.env`.*
