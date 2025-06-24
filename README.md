# Installation and Setup

## Clone Repository
- Clone repository
- Install PostgreSQL
- Create database on pgAdmin

## Create a .env file that will connect backend with database

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=

## Running the Application

## Development Mode

**Bash Terminal**

**Start Backend (Terminal 1):**

cd authentication
npm run dev

**Start Frontend (Terminal 2):**
```bash
cd my-auth-frontend
PORT=3001 npm start