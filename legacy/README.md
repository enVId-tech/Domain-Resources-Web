# Domain Resources Web

A Next.js web application for managing and displaying domain resources with active link monitoring. This project provides a dynamic link management system with real-time URL validation and status tracking.

## Features

- **Link Management**: Display and manage a collection of links with metadata (title, URL, description, icon)
- **Active Link Monitoring**: Real-time validation of link availability
- **MongoDB Integration**: Persistent storage using Mongoose
- **API Routes**: RESTful API endpoints for link operations
- **Modern UI**: Built with React 19 and SCSS styling
- **Docker Support**: Containerized deployment ready
- **TypeScript**: Fully typed for better development experience

## Prerequisites

- Node.js (latest version)
- MongoDB instance (local or cloud-based)
- npm, yarn, pnpm, or bun package manager

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/enVId-tech/Domain-Resources-Web.git
   cd Domain-Resources-Web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `stack.env` file in the root directory with your MongoDB connection string and other required variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   # Add other environment variables as needed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality
- `npm run ncu` - Update all dependencies to their latest versions

## Docker Deployment

Build and run the application using Docker:

```bash
# Build the Docker image
docker build -t domain-resources-web .

# Run the container
docker run -p 3090:3090 --env-file stack.env domain-resources-web
```

The application will be available at [http://localhost:3090](http://localhost:3090).

## Project Structure

```
├── app/
│   ├── api/
│   │   └── links/          # API endpoints for link management
│   │       └── route.ts    # GET endpoint for fetching links
│   ├── error/              # Error page components
│   ├── links/              # Links display page
│   ├── utils/
│   │   ├── db.ts          # MongoDB connection utilities
│   │   └── validation.ts   # URL validation utilities
│   ├── _app.tsx           # Custom App component
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── public/                # Static assets
├── styles/                # SCSS stylesheets
├── Dockerfile             # Docker configuration
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## API Endpoints

### GET `/api/links`

Fetches all links from the database with their active status.

**Response:**
```json
{
  "success": true,
  "links": [
    {
      "id": 1,
      "title": "Example Link",
      "url": "https://example.com",
      "description": "Description text",
      "icon": "icon-url"
    }
  ],
  "linksActive": [
    {
      "link": "https://example.com",
      "active": true
    }
  ]
}
```

**Cache:** 20 minutes with 10-minute stale-while-revalidate

## Tech Stack

- **Framework**: [Next.js 16.1.1](https://nextjs.org/) with App Router
- **Runtime**: React 19.2.3
- **Language**: TypeScript 5
- **Database**: MongoDB with Mongoose 9.1.1
- **Styling**: SASS/SCSS 1.97.1
- **Icons**: React Icons 5.5.0
- **Linting**: ESLint 9
- **Containerization**: Docker

### Environment Variables

Ensure your `stack.env` file contains:
- `MONGODB_URI` - MongoDB connection string
- Additional environment variables as needed for your deployment

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.