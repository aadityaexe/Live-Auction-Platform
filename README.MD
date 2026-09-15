# 🔨 Live Auction Platform

A full-stack **real-time online auction platform** built with the MERN
ecosystem. The project is designed to handle live bidding, concurrent
users, automated auction lifecycle management, secure authentication,
real-time notifications, wallets, payments, orders, and seller/buyer
dashboards.

The main focus of this project is not only building the UI and APIs, but
also understanding the backend engineering problems that appear in a
real auction system --- especially **race conditions, atomic database
operations, idempotency, real-time synchronization, auction timing,
payment verification, and financial consistency**.

## 🚀 Project Overview

Unlike a traditional e-commerce application where a product has a fixed
price, an auction allows multiple users to compete for the same product.

Example:

``` text
Current Price: ₹50,000

User A → ₹51,000
User B → ₹52,000
User C → ₹55,000
```

The backend must guarantee that the auction state remains correct even
when many users place bids at nearly the same time.

The platform is being built with the following principles:

-   Server-side validation
-   Atomic database updates
-   Race-condition protection
-   Idempotent APIs
-   Real-time updates
-   Automated auction lifecycle
-   Secure payment verification
-   Immutable financial transaction history
-   Role-based access control

------------------------------------------------------------------------

# ✨ Features

## 👤 Authentication & Authorization

-   User registration
-   User login
-   JWT authentication
-   Protected routes
-   Role-based authorization
-   Buyer role
-   Seller role
-   Admin role
-   Account status management
-   Centralized error handling
-   Request validation

------------------------------------------------------------------------

## 🔨 Auction Management

Sellers can create and manage auctions.

### Auction features

-   Create auction
-   View auction
-   Browse auctions
-   Update auction
-   Cancel auction
-   Auction categories
-   Search
-   Filtering
-   Sorting
-   Pagination
-   Auction status management
-   Scheduled auctions
-   Live auctions
-   Ending auctions
-   Completed auctions

### Auction lifecycle

``` text
DRAFT
   ↓
SCHEDULED
   ↓
LIVE
   ↓
ENDING
   ↓
ENDED
   ↓
PAYMENT_PENDING
   ↓
PAYMENT_COMPLETED
   ↓
FULFILLED
```

Possible alternative states:

``` text
SCHEDULED → CANCELLED
LIVE      → CANCELLED
ENDED     → DISPUTED
```

------------------------------------------------------------------------

# ⚡ Real-Time Bidding

The core feature of the platform is real-time bidding.

A user can place a bid while an auction is live.

The expected flow is:

``` text
User
  ↓
POST /api/auctions/:auctionId/bids
  ↓
Authentication
  ↓
Validation
  ↓
Auction checks
  ↓
Atomic MongoDB update
  ↓
Bid history created
  ↓
Socket.IO event
  ↓
Connected users receive the new bid
```

Users do not need to refresh the page to see the latest auction price.

------------------------------------------------------------------------

# 🛡️ Race Condition Protection

Race conditions are one of the most important problems in an auction
platform.

For example:

``` text
Current Price = ₹50,000

User A → ₹51,000
User B → ₹52,000
```

Both requests may read the same old price.

A simple read → modify → save approach can produce incorrect results.

The project uses **atomic MongoDB operations** to make the price update
conditional on the current database state.

Conceptually:

``` js
await Auction.findOneAndUpdate(
  {
    _id: auctionId,
    status: "LIVE",
    currentPrice: previousPrice
  },
  {
    $set: {
      currentPrice: newBid
    },
    $inc: {
      bidCount: 1,
      version: 1
    }
  }
);
```

If another request changes the price first, the second update no longer
matches the expected `currentPrice` and is rejected.

This prevents stale reads from overwriting newer auction state.

------------------------------------------------------------------------

# 🔁 Idempotent Bidding

Network failures and client retries can cause the same request to be
sent more than once.

Example:

``` text
Request 1 → ₹51,000
Request 2 → Same request accidentally retried
```

Each bid request contains a unique `requestId`.

The backend checks whether that request has already been processed.

``` text
First request
     ↓
Create bid

Same request again
     ↓
Return existing bid
```

This prevents duplicate bid records and makes the bidding API safer
under retries.

------------------------------------------------------------------------

# ⏰ Automated Auction Lifecycle

Auctions use `startTime` and `endTime`.

A scheduled auction should automatically become live when its start time
arrives.

``` text
Before startTime
       ↓
   SCHEDULED
       ↓
   startTime
       ↓
      LIVE
       ↓
    endTime
       ↓
     ENDED
```

The backend is responsible for auction timing rather than trusting a
frontend timer.

The project uses a `jobs/` architecture for background processing, with
Redis/BullMQ planned for a more scalable production implementation.

------------------------------------------------------------------------

# 🤖 Auto Bidding

The platform is designed to support automatic bidding.

Example:

``` text
Current Price: ₹10,000

User maximum: ₹20,000
Increment: ₹500
```

If another bidder places:

``` text
₹10,500
```

the auto-bidding system can respond:

``` text
₹11,000
```

The system continues bidding on behalf of the user until the configured
maximum is reached.

A user's maximum bid must never be exposed to other bidders.

------------------------------------------------------------------------

# 🏦 Wallet System

The platform includes a wallet architecture for handling user balances
and auction-related financial operations.

Supported operations include:

-   Deposits
-   Withdrawals
-   Bid holds
-   Bid releases
-   Payments
-   Refunds
-   Seller payouts
-   Platform fees

Wallet state:

``` text
Available Balance
+
Held Balance
=
Total Wallet Balance
```

------------------------------------------------------------------------

# 📒 Wallet Transaction Ledger

Financial operations are stored separately in a transaction ledger.

Examples:

``` text
DEPOSIT
WITHDRAWAL
BID_HOLD
BID_RELEASE
PAYMENT
REFUND
PAYOUT
FEE
ADJUSTMENT
```

The wallet balance alone should not be treated as the complete financial
history.

Each financial operation can have:

-   Reference ID
-   Transaction type
-   Amount
-   Balance before
-   Balance after
-   Status
-   Idempotency key
-   Metadata
-   Timestamp

------------------------------------------------------------------------

# 💳 Payment Integration

The platform is designed to integrate with:

-   Razorpay
-   Stripe

Payment flow:

``` text
Auction Ends
      ↓
Winner Selected
      ↓
Order Created
      ↓
Payment Created
      ↓
User Completes Payment
      ↓
Backend Verifies Payment
      ↓
Payment Webhook
      ↓
Order → PAID
```

The frontend is never treated as the final authority for payment
success.

Payment verification and webhook processing are handled by the backend.

------------------------------------------------------------------------

# 🔔 Notifications

The notification system supports events such as:

``` text
OUTBID
AUCTION_STARTED
AUCTION_ENDING
AUCTION_WON
AUCTION_ENDED
PAYMENT_SUCCESS
PAYMENT_FAILED
ORDER_CREATED
ORDER_SHIPPED
ORDER_DELIVERED
REFUND
SYSTEM
```

Notifications can be persisted in MongoDB and delivered in real time
using Socket.IO.

------------------------------------------------------------------------

# ❤️ Watchlist

Users can save auctions to their watchlist.

Features:

-   Add auction
-   Remove auction
-   View watchlist
-   Auction start notifications
-   Auction ending notifications

A compound unique index prevents the same user from adding the same
auction multiple times.

------------------------------------------------------------------------

# 🛍️ Orders

After an auction ends and a winner is selected, an order can be created.

An order contains:

-   Buyer
-   Seller
-   Auction
-   Product information
-   Winning amount
-   Platform fee
-   Shipping fee
-   Total amount
-   Payment
-   Shipping address
-   Tracking number
-   Order status

### Order lifecycle

``` text
PAYMENT_PENDING
       ↓
     PAID
       ↓
  PROCESSING
       ↓
    SHIPPED
       ↓
   DELIVERED
       ↓
  COMPLETED
```

Possible alternative states include:

``` text
CANCELLED
REFUNDED
DISPUTED
```

------------------------------------------------------------------------

# 📊 Seller Dashboard

The seller dashboard is designed to provide:

-   Total auctions
-   Active auctions
-   Completed auctions
-   Total bids
-   Current highest bids
-   Orders
-   Revenue
-   Payouts
-   Auction performance

------------------------------------------------------------------------

# 👤 Buyer Dashboard

The buyer dashboard is designed to provide:

-   Active bids
-   Bid history
-   Won auctions
-   Watchlist
-   Orders
-   Payments
-   Wallet
-   Notifications

------------------------------------------------------------------------

# 🧠 AI Price Prediction

The project is designed to support AI-powered auction price prediction.

Potential inputs include:

-   Product category
-   Starting price
-   Historical auction prices
-   Number of bids
-   Product popularity
-   Auction duration
-   Previous auction data

The goal is to provide an estimated auction/market price and useful
insights to sellers and buyers.

------------------------------------------------------------------------

# 🏗️ System Architecture

``` text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │ React + TypeScript  │
                    └──────────┬──────────┘
                               │
                     HTTP / WebSocket
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
       REST API / Express                  Socket.IO
              │                                 │
              └────────────────┬────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Services       │
                    │   Business Logic    │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
          MongoDB            Redis          Background Jobs
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    External Services
                               │
                  ┌────────────┴────────────┐
                  │                         │
               Razorpay                  Stripe
```

------------------------------------------------------------------------

# 🛠️ Technology Stack

## Frontend

-   React
-   TypeScript
-   Redux Toolkit
-   React Router
-   Socket.IO Client
-   Responsive UI

## Backend

-   Node.js
-   Express.js
-   JavaScript
-   MongoDB
-   Mongoose
-   Zod
-   JWT
-   Socket.IO

## Infrastructure

-   Redis
-   Background Jobs
-   Docker
-   GitHub Actions
-   REST APIs
-   WebSockets

## Payments

-   Razorpay
-   Stripe

------------------------------------------------------------------------

# 📁 Project Structure

``` text
Live-Auction-Platform/
│
├── Backend/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── errors/
│   │   │   ├── AppError.js
│   │   │   ├── errorCodes.js
│   │   │   └── errorHandler.js
│   │   ├── events/
│   │   ├── jobs/
│   │   ├── logger/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   │   └── handlers/
│   │   ├── tests/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

------------------------------------------------------------------------

# 🗄️ Database Design

The application uses MongoDB with separate collections for different
responsibilities.

## Main Collections

``` text
Users
Auctions
Bids
AutoBids
Wallets
WalletTransactions
Orders
Payments
Notifications
Watchlists
Categories
AuditLogs
```

------------------------------------------------------------------------

## User

Stores authentication and account information.

``` js
{
  name,
  email,
  password,
  phone,
  avatar,
  role,
  status,
  isEmailVerified,
  lastLoginAt,
  failedLoginAttempts,
  lockedUntil,
  refreshTokenVersion,
  createdAt,
  updatedAt
}
```

Roles:

``` text
BUYER
SELLER
ADMIN
```

------------------------------------------------------------------------

## Auction

Stores the current state of an auction.

``` js
{
  sellerId,
  title,
  description,
  images,
  categoryId,
  startingPrice,
  currentPrice,
  minimumIncrement,
  reservePrice,
  startTime,
  endTime,
  status,
  highestBidderId,
  winnerId,
  bidCount,
  viewCount,
  watchCount,
  version,
  extensionCount,
  maxExtensionSeconds,
  createdAt,
  updatedAt
}
```

The Auction collection stores the current auction state. Individual bid
history is stored in the Bid collection.

------------------------------------------------------------------------

## Bid

Stores individual bids.

``` js
{
  auctionId,
  bidderId,
  amount,
  previousAmount,
  bidType,
  status,
  requestId,
  sequenceNumber,
  createdAt,
  updatedAt
}
```

------------------------------------------------------------------------

## AutoBid

Stores automatic bidding configuration.

``` js
{
  auctionId,
  bidderId,
  maximumAmount,
  increment,
  currentAutoBid,
  status,
  createdAt,
  updatedAt
}
```

The maximum amount must remain private.

------------------------------------------------------------------------

## Wallet

Stores current wallet state.

``` js
{
  userId,
  balance,
  heldBalance,
  availableBalance,
  currency,
  status,
  version,
  createdAt,
  updatedAt
}
```

------------------------------------------------------------------------

## WalletTransaction

Stores financial history.

``` js
{
  userId,
  walletId,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  referenceType,
  referenceId,
  status,
  idempotencyKey,
  description,
  metadata,
  createdAt,
  updatedAt
}
```

------------------------------------------------------------------------

## Order

Stores the result of a successful auction.

``` js
{
  orderNumber,
  auctionId,
  buyerId,
  sellerId,
  winnerId,
  item,
  amount,
  platformFee,
  shippingFee,
  totalAmount,
  paymentId,
  status,
  shippingAddress,
  trackingNumber,
  paidAt,
  shippedAt,
  deliveredAt,
  createdAt,
  updatedAt
}
```

------------------------------------------------------------------------

## Payment

Stores payment-provider information.

``` js
{
  orderId,
  auctionId,
  userId,
  provider,
  providerOrderId,
  providerPaymentId,
  amount,
  currency,
  status,
  paymentMethod,
  idempotencyKey,
  verifiedAt,
  failureReason,
  metadata,
  createdAt,
  updatedAt
}
```

------------------------------------------------------------------------

# 🔌 API Design

## Authentication

``` http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

## Auctions

``` http
POST   /api/auctions
GET    /api/auctions
GET    /api/auctions/:auctionId
PATCH  /api/auctions/:auctionId
DELETE /api/auctions/:auctionId
```

## Bidding

``` http
POST /api/auctions/:auctionId/bids
GET  /api/auctions/:auctionId/bids
```

## Auction Lifecycle

``` http
POST /api/auctions/:auctionId/start
POST /api/auctions/:auctionId/end
POST /api/auctions/:auctionId/cancel
```

Lifecycle operations should ultimately be controlled by backend jobs and
server-side rules rather than trusting the client.

------------------------------------------------------------------------

# 🔐 Security

Security is a major part of the project.

Security measures include:

-   JWT authentication
-   Password hashing
-   Role-based authorization
-   Protected APIs
-   Zod request validation
-   Centralized error handling
-   Seller ownership checks
-   Bidder authorization
-   Payment verification
-   Webhook verification
-   Idempotency
-   Rate limiting
-   Secure environment variables
-   Audit logging
-   Input validation
-   Protection against unauthorized auction modification

Sensitive information such as passwords, JWT secrets, API keys, and
payment secrets must never be committed to Git.

------------------------------------------------------------------------

# ❌ Centralized Error Handling

The backend uses a centralized error-handling system.

API errors follow a consistent structure:

``` json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data"
}
```

Common error codes:

``` text
BAD_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
VALIDATION_ERROR
INTERNAL_SERVER_ERROR
```

------------------------------------------------------------------------

# 🧪 Testing

Important auction scenarios include:

### Bid validation

``` text
✓ User is authenticated
✓ Auction exists
✓ Auction is live
✓ Auction has not expired
✓ Bidder is not the seller
✓ Bid meets minimum increment
```

### Concurrency

``` text
✓ Multiple users bid simultaneously
✓ Higher bid wins
✓ Lower bid cannot overwrite newer price
✓ Atomic update protects auction state
```

### Idempotency

``` text
✓ Same requestId sent twice
✓ Only one bid is created
✓ Existing bid can be returned
```

### Auction lifecycle

``` text
✓ Scheduled auction starts automatically
✓ Expired auction rejects bids
✓ Ended auction cannot accept bids
✓ Winner can be selected
```

------------------------------------------------------------------------

# 🌐 Real-Time Architecture

Socket.IO is used for real-time auction communication.

Possible events:

``` text
auction:started
auction:updated
auction:bid
auction:outbid
auction:ending
auction:ended
notification:new
```

Example:

``` text
User A places bid
       ↓
Backend validates bid
       ↓
MongoDB atomic update
       ↓
Bid saved
       ↓
Socket.IO event
       ↓
All users watching auction receive update
```

------------------------------------------------------------------------

# ⚙️ Environment Variables

Create a `.env` file inside the Backend directory:

``` env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

REDIS_URL=your_redis_url

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

STRIPE_SECRET_KEY=your_stripe_secret

CLIENT_URL=http://localhost:5173
```

Never commit `.env` to Git.

Recommended `.gitignore`:

``` gitignore
.env
.env.local
node_modules/
dist/
```

------------------------------------------------------------------------

# 🚀 Installation

## 1. Clone the repository

``` bash
git clone https://github.com/aadityaexe/Live-Auction-Platform.git
cd Live-Auction-Platform
```

## 2. Backend Setup

``` bash
cd Backend
npm install
```

Create your `.env` file and configure MongoDB and authentication
variables.

Start the development server:

``` bash
npm run dev
```

Backend:

``` text
http://localhost:3000
```

## 3. Frontend Setup

Open another terminal:

``` bash
cd Frontend
npm install
npm run dev
```

Frontend will normally run at:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# 🗺️ Development Roadmap

The project is being developed incrementally.

## Day 1 --- Architecture & Database

-   Project architecture
-   Database design
-   Collection planning
-   Backend structure

## Day 2 --- Authentication

-   Registration
-   Login
-   JWT
-   Authentication middleware
-   Error handling

## Day 3 --- Auction Module

-   Auction model
-   Auction API structure
-   Auction CRUD
-   Validation

## Day 4 --- Auction APIs

-   Auction controllers
-   Auction services
-   Validation
-   Ownership checks
-   API testing

## Day 5 --- Debugging & Reliability

-   Backend debugging
-   Validation improvements
-   Error handling improvements
-   Security checks
-   Edge cases

## Day 6 --- Concurrency & Bidding

-   Bid API
-   Bid validation
-   Atomic MongoDB updates
-   Race-condition protection
-   Idempotency
-   Bid history

## Day 7 --- Real-Time Bidding

-   Socket.IO
-   Live bid events
-   Real-time auction updates
-   Real-time notifications

## Day 8 --- Redis

-   Redis integration
-   Scaling
-   Shared real-time state
-   Background job infrastructure

## Day 9 --- Auto Bidding

-   Maximum bid
-   Automatic bidding
-   Increment handling
-   Auto-bid conflicts

## Day 10 --- Auction Finalization

-   Automatic auction ending
-   Winner selection
-   Anti-sniping
-   Auction extension
-   Finalization safety

## Day 11 --- Wallet & Orders

-   Wallet
-   Held balance
-   Transaction ledger
-   Order creation

## Day 12 --- Payments

-   Razorpay
-   Stripe
-   Payment creation
-   Payment verification

## Day 13 --- Webhooks & Notifications

-   Payment webhooks
-   Notification system
-   Seller dashboard
-   Buyer dashboard

## Day 14 --- Security & Testing

-   Security hardening
-   Rate limiting
-   Testing
-   Edge cases
-   Failure scenarios

## Day 15+ --- Production

-   Docker
-   CI/CD
-   Deployment
-   Monitoring
-   Logging
-   Performance improvements
-   Production reliability

The original target was 15 days, but the project is intentionally being
expanded as deeper backend and system-design requirements are
discovered.

------------------------------------------------------------------------

# 🧠 Key Engineering Challenges

## 1. Race Conditions

Multiple users can place bids simultaneously.

**Solution:**

``` text
Atomic MongoDB operations
```

## 2. Duplicate Requests

Clients may retry requests.

**Solution:**

``` text
Idempotency keys
```

## 3. Auction Timing

Frontend timers cannot be trusted as the source of truth.

**Solution:**

``` text
Server-side time
+
Background jobs
```

## 4. Real-Time Synchronization

Every connected bidder needs the latest state.

**Solution:**

``` text
Socket.IO
```

## 5. Distributed Processing

Multiple backend instances can process the same auction.

**Solution:**

``` text
Redis
+
Job queues
+
Atomic database operations
```

## 6. Financial Consistency

Wallet and transaction data must remain consistent.

**Solution:**

``` text
Wallet state
+
Immutable transaction ledger
+
Idempotency
+
Database transactions where appropriate
```

## 7. Payment Security

Frontend payment responses cannot be blindly trusted.

**Solution:**

``` text
Backend verification
+
Provider webhooks
+
Idempotent payment processing
```

------------------------------------------------------------------------

# 📈 Future Improvements

Planned improvements include:

-   Advanced search
-   Product recommendations
-   AI price prediction
-   AI auction insights
-   Seller analytics
-   Buyer analytics
-   Fraud detection
-   Anti-bot bidding
-   Rate limiting
-   Anti-sniping extensions
-   Email notifications
-   SMS notifications
-   Push notifications
-   Multiple currencies
-   International payments
-   Refund management
-   Dispute management
-   Admin dashboard
-   Advanced reporting
-   Auction analytics
-   Horizontal backend scaling
-   Monitoring and observability

------------------------------------------------------------------------

# 📚 What This Project Covers

This project is being used to learn and practice:

-   React
-   TypeScript
-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   REST API design
-   JWT authentication
-   Middleware architecture
-   Zod validation
-   Centralized error handling
-   Socket.IO
-   WebSockets
-   Redis
-   Background jobs
-   Concurrency
-   Race conditions
-   Atomic database operations
-   Idempotency
-   Payment systems
-   Webhooks
-   Wallet architecture
-   Transaction ledgers
-   System design
-   Security
-   Docker
-   CI/CD

------------------------------------------------------------------------

# 🤝 Contributing

Contributions and suggestions are welcome.

Fork the repository, create a feature branch, make your changes, and
open a Pull Request.

Example:

``` bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

------------------------------------------------------------------------

# ⚠️ Disclaimer

This project is currently intended for **learning, experimentation, and
portfolio purposes**.

Financial operations, payment integrations, wallets, and production
auction systems require additional security reviews, testing,
monitoring, and compliance before being used commercially.

------------------------------------------------------------------------

# 🔗 Repository

GitHub:

https://github.com/aadityaexe/Live-Auction-Platform

------------------------------------------------------------------------

# ⭐ Support

If you find the project useful or interesting, consider giving the
repository a ⭐ on GitHub.

------------------------------------------------------------------------

## 👨‍💻 Author

**Aditya**

Building a real-world auction platform while learning backend
engineering, concurrency, real-time systems, and scalable architecture.
