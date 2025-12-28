# IpaidUpay Client

IpaidUpay Client is the frontend application for the group buying platform. It provides a responsive interface for users to join groups, place orders, and manage group buying activities.

## Features

- **Dashboard**: View all active and past groups.
- **Group Creation**: Create new groups with custom menus and schedule (Start/End time).
- **Ordering Interface**: Interactive menu selection, cart management, and real-time total calculation.
- **Group Summary**: Aggregate view of all orders by item and participant.
- **Payment Tracking**: Track who has paid and view balance summaries.
- **Friend Management**: Invite friends to groups.

## Tech Stack

- **Framework**: Vue.js 3
- **Build Tool**: Vite
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Server**: Nginx (Production Docker)

## Environment Setup

The client is configured to use a relative API path (`/api`) which is proxied to the backend. No `.env` file is strictly required for basic operation if running via Docker or if the proxy is configured in Vite.

### Proxy Configuration

- **Docker/Nginx**: Configured in `nginx.conf` to proxy `/api` to the backend.
- **Development (Vite)**: `vite.config.js` should be configured to proxy `/api` to `http://localhost:3001` if running locally without Docker.

## Running the Application

### Using Docker (Recommended)

Run the client container:

```bash
docker compose up -d
```

Access the app at `http://localhost:8080`.

### Manual Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173` (ensure proxy is configured or backend is reachable).

3. **Build for Production**:
   ```bash
   npm run build
   ```
   The output will be in `dist/`.

## API Connection

The application expects the API to be available at `/api`.
- In Docker: Nginx proxies `/api` to the backend service.
- In Local Dev: Ensure your Vite config proxies `/api` to your running backend (e.g., localhost:3001).
