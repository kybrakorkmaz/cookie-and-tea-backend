# cookie-and-tea-backend

A creator support platform API built with Express.js and PostgreSQL. Similar to Buy Me a Coffee or Ko-fi, this application allows creators to receive support through donations and messages from their supporters.

## Overview

Cookie and Tea Backend provides a RESTful API for managing user authentication, profiles, posts, donations, and community interactions. The backend is containerized with Docker and supports multiple deployment environments with integrated testing infrastructure.

### Key Features

- User authentication and authorization with JWT
- Creator profiles and supporter management
- Post creation and management
- Donation tracking and processing
- Email notifications
- Database migrations and version control
- Comprehensive test coverage
- Production-ready Docker setup

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development without Docker)
- PostgreSQL 15+ (for local development without Docker)
- Bash-compatible shell (Git Bash, WSL, or Linux/macOS)

### Quick Start

#### Docker Setup (Recommended)

1. Clone the repository and navigate to the project directory
2. Configure environment variables by copying the example file:
   ```bash
   cp .env.example .env
   ```
   Update the values in `.env` with your configuration.

3. Start the development environment:
   ```bash
   npm run docker:dev up
   ```

4. Run database migrations:
   ```bash
   npm run docker:dev migrate
   ```

The API will be available at `http://localhost:8000`

#### Local Development

If you prefer running the Node.js server directly on your host machine:

```bash
npm install
npm run db:migrate
npm run dev
```

Ensure a PostgreSQL instance is running with the `DATABASE_URL` properly configured in `.env`.

---

## Environment Configuration

Environment variables are managed through `.env` files. Use the `.env.example` file as a reference template.

### Key Environment Variables

- `NODE_ENV`: Application environment (development, test, production)
- `PORT`: API server port
- `BASE_URL`: Base URL for the API
- `JWT_SECRET`: Secret key for JWT token signing
- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database credentials

For development with pgAdmin:
- `PGADMIN_DEFAULT_EMAIL`: pgAdmin login email
- `PGADMIN_DEFAULT_PASSWORD`: pgAdmin login password
- `PGADMIN_PORT`: pgAdmin interface port (default: 5050)

---

## Project Structure

### Environment Management

This project uses coordinated bash scripts and npm commands to manage different environments (Development, Test, Production).

#### Bash Scripts

The core automation logic resides in `src/scripts/bash/`:
- `dev.sh`: Manages the development stack
- `test.sh`: Manages the test environment and runs tests
- `prod.sh`: Manages the production stack

Usage format: `npm run <environment> <command>`

#### Command Support Matrix

| Command | Development | Testing | Production | Description |
|---------|:-----------:|:-------:|:----------:|-------------|
| up | Yes | Yes | Yes | Start the environment |
| down | Yes | Yes | Yes | Stop and remove containers |
| logs | Yes | Yes | Yes | Stream container logs |
| migrate | Yes | Yes | No | Run database migrations |
| run | No | Yes | No | Full test cycle: up → migrate → test → down |
| restart | Yes | No | No | Restart development containers |
| ps | Yes | No | Yes | List container status |

---

## Development

### Starting the Development Environment

```bash
npm run docker:dev up
```

This starts:
- Express API server on port 8000
- PostgreSQL database on port 5434
- pgAdmin on port 5050

### Running Migrations

```bash
npm run docker:dev migrate
```

### Viewing Logs

```bash
npm run docker:logs
```

### Restarting Containers

```bash
npm run docker:dev restart
```

### Stopping the Environment

```bash
npm run docker:dev down
```

To also remove database volumes (reset database):
```bash
npm run docker:dev down -v
```

### Database Access

- **pgAdmin:** Navigate to `http://localhost:5050`
- **Internal Database:** `postgres://localhost:5432`
- **External Database:** `postgres://localhost:5434`

---

## Testing

Tests are executed in an isolated Docker environment to ensure consistency and prevent interference with development data.

### Running Tests

Complete test cycle (creates environment, runs migrations, executes tests, cleans up):
```bash
npm run test:docker run
```

### Manual Test Environment Control

Start test containers:
```bash
npm run test:docker up
```

Run database migrations on test database:
```bash
npm run test:docker migrate
```

Watch mode for development testing:
```bash
npm run test:docker watch
```

Stop and clean up test containers:
```bash
npm run test:docker down
```

### Parallel Development and Testing

Both development and test environments can run simultaneously:
- Development: Port 8000, Database 5434
- Testing: Port 8001, Database 5435

This allows feature development and testing without stopping containers or switching contexts.

---

## Production

The production environment uses a multi-stage Docker build for optimized image size and security.

### Starting Production

```bash
npm run prod up
```

### Viewing Production Logs

```bash
npm run prod logs
```

### Stopping Production

```bash
npm run prod down
```

### Production Features

- Non-root user execution for security
- Minimal production dependencies
- Health check endpoint for monitoring
- Optimized Alpine Linux base image

---

## Technology Stack

### Core Framework
- Express.js 5.2+: Web application framework
- Node.js 22+: JavaScript runtime

### Database
- PostgreSQL 15+: Relational database
- Drizzle ORM: Type-safe SQL query builder
- Drizzle Kit: Database schema management

### Authentication & Security
- JWT (jsonwebtoken): Token-based authentication
- bcrypt: Password hashing
- CORS: Cross-Origin Resource Sharing

### Email & Notifications
- Nodemailer: Email delivery
- Winston: Structured logging

### Development & Testing
- Jest: Unit and integration testing
- Supertest: HTTP assertion library and server mocking
- ESLint: Code quality and style

### Utilities
- Zod: Schema validation and TypeScript inference
- Morgan: HTTP request logging

---

## Code Quality

### Linting

Check code quality:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

### Testing

Run tests locally (requires local PostgreSQL setup):
```bash
npm test
```

---

## Database

### Migrations

Generate new migration based on schema changes:
```bash
npm run db:generate
```

Run pending migrations:
```bash
npm run db:migrate
```

### Schema

Database schema is defined in `src/db/schema/` using Drizzle ORM's schema builder.

---

## Contributing

When contributing to this project:

1. Run linting checks before committing
2. Ensure all tests pass
3. Follow the existing code structure and naming conventions
4. Use meaningful commit messages

---

## License

ISC

---

## Support

For issues and questions, please visit the GitHub repository issue tracker.
