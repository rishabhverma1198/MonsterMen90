# MonsterBackend - Backend Service

This is the backend service for the MonsterMen90 e-commerce platform, built with Node.js and Supabase.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project
- PostgreSQL (for local development)

## Setup Instructions

### 1. Install Dependencies

```bash
cd MonsterBackend
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Supabase Configuration

To connect to Supabase, you need to set up the following environment variables:

#### Required Variables:

- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project-ref.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings > API)

#### How to get Supabase credentials:

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Project Settings** > **API**
4. Copy the **Project URL** (this is your `SUPABASE_URL`)
5. Copy the **Service role secret** (this is your `SUPABASE_SERVICE_ROLE_KEY`)

### 4. Running the Server

```bash
npm start
# or for development with auto-restart
npm run dev
```

The server will start on the port specified in your `.env` file (default: 3001).

### 5. Database Setup

The backend uses Supabase as its database. Make sure you have:

1. Created the required tables in Supabase
2. Set up proper Row Level Security (RLS) policies
3. Configured your service role with appropriate permissions

## Project Structure

```
MonsterBackend/
├── .env.example          # Environment variable template
├── README.md             # This file
├── package.json         # Project dependencies
├── server.js            # Main server entry point
├── db/                  # Database configuration
│   └── db.js            # Supabase client setup
└── routes/              # API routes
    └── adminStock.routes.js
```

## Security Notes

- **Never commit your `.env` file** to version control
- **Keep your service role key secure** - it has full access to your database
- Use environment variables for all sensitive configuration
- In production, use proper secret management (AWS Secrets Manager, Kubernetes secrets, etc.)

## Development vs Production

For development, you can use the local Supabase instance:
```
SUPABASE_URL=http://localhost:54321
```

For production, use your live Supabase project URL:
```
SUPABASE_URL=https://your-project-ref.supabase.co
```

## Troubleshooting

### Missing environment variables
If you see errors about missing environment variables, ensure:
1. You have created a `.env` file from `.env.example`
2. All required variables are set
3. The server has been restarted after changing environment variables

### Connection issues
- Verify your Supabase URL is correct
- Check that your service role key is valid
- Ensure your network allows connections to Supabase
- Verify your Supabase project is not in maintenance mode

## License

This project is part of the MonsterMen90 e-commerce platform.