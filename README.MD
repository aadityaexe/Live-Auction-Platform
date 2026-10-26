# Live Auction Platform

A real-time auction web application featuring live bidding, wallet-based escrow, and order processing.

## Tech Stack

- Backend: Node.js, Express, TypeScript, MongoDB, Socket.IO
- Frontend: React, TypeScript, Vite, Tailwind CSS, Redux Toolkit
- Payments: Razorpay

## Setup

### Prerequisites

- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. Install backend dependencies:
   ```bash
   cd Backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd ../Frontend
   npm install
   ```

3. Configure environment files:
   - Copy `Backend/.env.example` to `Backend/.env`
   - Copy `Frontend/.env.example` to `Frontend/.env`

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (`development` or `production`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for access token signing |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing |
| `JWT_ACCESS_EXPIRY` | Access token lifetime (e.g. 15m) |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime (e.g. 7d) |
| `CLIENT_URL` | Frontend client origin (default: http://localhost:5173) |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (e.g. 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |

### Frontend (`Frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL (e.g. http://localhost:5000/api) |
| `VITE_WS_URL` | WebSocket server URL (e.g. http://localhost:5000) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key ID for checkout modal |

## Database Seeding

To populate the database with initial categories, test accounts, and auctions:

```bash
cd Backend
npm run seed
```

Default seeded accounts:
- Admin: `admin@auction.local` / `Password123!`
- Seller: `seller@auction.local` / `Password123!`
- Buyer: `buyer@auction.local` / `Password123!`

## Run Commands

Start the backend API server:
```bash
cd Backend
npm run dev
```

Start the frontend development server:
```bash
cd Frontend
npm run dev
```

Build backend:
```bash
cd Backend
npm run build
```

Build frontend:
```bash
cd Frontend
npm run build
```
