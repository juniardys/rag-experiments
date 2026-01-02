# RAG Experiments - AI Analytics SaaS API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  A production-grade multi-tenant AI analytics platform for marketing analytics featuring Retrieval-Augmented Generation (RAG) capabilities.
</p>

## Description

This project is an AI-powered analytics platform designed for marketing analytics, specifically focused on Key Opinion Leader (KOL) and content performance analysis. It features a three-stage AI pipeline (Planner → Executor → Analyst) that enables natural language querying of marketing data using RAG (Retrieval-Augmented Generation) technology.

### Key Features

- **Natural Language Querying**: Ask questions about your marketing data in plain language
- **KOL Analytics**: Track and analyze Key Opinion Leader performance across multiple social media platforms
- **Content Analysis**: Analyze posts, captions, hashtags, and engagement metrics
- **Semantic Search**: Vector-based semantic search using pgvector for finding relevant content
- **AI-Powered Insights**: Get intelligent recommendations and performance metrics through LLM integration
- **Multi-Platform Support**: Works with Instagram, Threads, Reels, and other social media platforms

## Tech Stack

### Backend Framework

- **NestJS** - Progressive Node.js framework for building efficient server-side applications
- **TypeScript** - Type-safe JavaScript

### Database & ORM

- **PostgreSQL** - Relational database
- **Prisma** - Next-generation ORM with type safety
- **pgvector** - PostgreSQL extension for vector similarity search

### AI/ML

- **LangChain** - Framework for building LLM applications
- **OpenRouter** - Unified API for accessing multiple LLM providers
- **Ollama** - Local LLM support for embeddings

### API Documentation

- **Swagger/OpenAPI** - Interactive API documentation

### Additional Tools

- **Zod** - TypeScript-first schema validation
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (package manager)
- **PostgreSQL** (v14 or higher) with **pgvector** extension
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/juniardys/rag-experiments
cd rag-experiments
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and fill in your configuration values. See [Environment Variables](#environment-variables) section below for details.

### 4. Setup PostgreSQL Database

#### 4.1. Create a PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rag_experiments;

# Connect to the database
\c rag_experiments
```

#### 4.2. Enable pgvector Extension

The application uses pgvector for vector similarity search. Enable it in your database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

You can verify the extension is installed:

```sql
\dx
```

### 5. Setup Prisma

#### 5.1. Generate Prisma Client

```bash
pnpm run prisma:generate
```

#### 5.2. Run Database Migrations

This will create all the necessary tables in your database:

```bash
pnpm run prisma:migrate
```

#### 5.3. (Optional) Seed the Database

Populate the database with sample data:

```bash
pnpm run prisma:seed
```

### 6. Run the Application

#### Development Mode (with hot reload)

```bash
pnpm run start:dev
```

#### Production Mode

```bash
# Build the application
pnpm run build

# Run in production mode
pnpm run start:prod
```

The application will be available at:

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rag_experiments?schema=public"

# OpenRouter API (for LLM access)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Optional Variables

```env
# Server Configuration
PORT=3000
CORS_ORIGIN="*"

# LLM Model Configuration
OPENROUTER_MODEL="openai/gpt-4o-mini"
EMBEDDING_MODEL="openai/text-embedding-3-small"
TOOL_CALLING_MODEL="nex-agi/deepseek-v3.1-nex-n1:free"

# LangSmith Tracing (Optional - for observability)
LANGSMITH_TRACING="false"
LANGSMITH_ENDPOINT=""
LANGSMITH_API_KEY=""
LANGSMITH_PROJECT=""
```

### Getting Your OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to your API keys section
4. Create a new API key
5. Add it to your `.env` file

## Project Structure

```
rag-experiments/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                 # Database seeding script
│   └── generated/              # Generated Prisma client
├── src/
│   ├── ai-marketing/           # AI marketing service
│   ├── chat/                   # Chat/query endpoints
│   ├── config/                 # Configuration service
│   ├── database/               # Database module (Prisma)
│   ├── executor/               # Executor service
│   ├── tools/                  # AI tools (KOL recommendation, post analysis, etc.)
│   └── main.ts                 # Application entry point
├── test/                       # E2E tests
└── .env.example                # Environment variables template
```

## Available Scripts

```bash
# Development
pnpm run start:dev          # Start in watch mode
pnpm run start:debug        # Start in debug mode

# Production
pnpm run build              # Build the application
pnpm run start:prod         # Start in production mode

# Database
pnpm run prisma:generate    # Generate Prisma client
pnpm run prisma:migrate     # Run database migrations
pnpm run prisma:seed        # Seed the database

# Code Quality
pnpm run lint               # Run ESLint
pnpm run format             # Format code with Prettier

# Testing
pnpm run test               # Run unit tests
pnpm run test:watch         # Run tests in watch mode
pnpm run test:cov           # Run tests with coverage
pnpm run test:e2e           # Run end-to-end tests
```

## API Documentation

Once the application is running, visit http://localhost:3000/api to access the interactive Swagger documentation. Here you can:

- Explore all available endpoints
- Test API calls directly from the browser
- View request/response schemas

## Database Schema

The application uses the following main models:

- **User**: Represents users of the platform
- **Kol**: Key Opinion Leaders with their social media profiles
- **Post**: Social media posts with embeddings for semantic search

## Usage Example

### Natural Language Query

Send a POST request to `/chat`:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which KOLs performed best this week?",
    "userId": "user-id-here"
  }'
```

The AI will automatically:

1. Understand your query
2. Select appropriate tools (KOL recommendation, post analysis, performance metrics)
3. Execute queries against the database
4. Return intelligent insights

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Check that the database exists and pgvector extension is enabled

### Prisma Issues

- Run `pnpm run prisma:generate` after schema changes
- Run `pnpm run prisma:migrate` to apply migrations
- Check Prisma logs for detailed error messages

### API Key Issues

- Verify your OpenRouter API key is valid
- Check that you have sufficient credits/quota
- Ensure the API key is correctly set in `.env`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is [MIT licensed](LICENSE).
