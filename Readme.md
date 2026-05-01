# ⌨️ TypSwift — Backend

A REST API backend for **TypSwift**, a typing speed test web application. Built with Node.js, Express, and MongoDB.

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection setup
├── controllers/
│   ├── auth.controller.js      # Register, login, get me
│   ├── test.controller.js      # Fetch paragraph, submit result
│   ├── user.controller.js      # User history and stats
│   └── leaderboard.controller.js
├── middleware/
│   ├── auth.middleware.js      # JWT verification
│   └── error.middleware.js     # Global error handler
├── models/
│   ├── User.model.js           # User schema
│   ├── TestResult.model.js     # Test result schema
│   └── Paragraph.model.js      # Paragraph schema
├── routes/
│   ├── auth.routes.js
│   ├── test.routes.js
│   ├── user.routes.js
│   └── leaderboard.routes.js
├── data/
│   └── paragraphs.json         # Seed data for paragraphs
├── scripts/
│   └── seed.js                 # DB seeding script
├── .env                        # Environment variables (never commit this)
├── .env.example                # Example env file (safe to commit)
├── .gitignore
├── package.json
└── server.js                   # App entry point
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vansh216/TypSwift_Backend.git
cd /.

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then fill in your values in .env

# 4. Seed the database with paragraphs
npm run seed

# 5. Start the development server
npm run dev
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory. See `.env.example` for reference.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the server runs on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/typebench` |
| `JWT_SECRET` | Secret key for signing JWTs | `your_super_secret_key` |
| `JWT_EXPIRES_IN` | JWT token expiry duration | `7d` |
| `NODE_ENV` | Environment mode | `development` |

---

## 📡 API Routes

### Auth — `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | ❌ |
| POST | `/api/auth/login` | Login and receive JWT token | ❌ |
| GET | `/api/auth/me` | Get current logged-in user | ✅ |

---

### Test — `/api/test`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/test/paragraph` | Fetch a random paragraph | ❌ |
| POST | `/api/test/submit` | Submit a completed test result | ✅ (optional) |

**Query params for GET `/api/test/paragraph`:**

| Param | Type | Options | Default |
|-------|------|---------|---------|
| `difficulty` | String | `easy`, `medium`, `hard` | `medium` |
| `duration` | Number | `1`, `2`, `3`, `5`, `10` | `3` |

---

### User — `/api/user`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/history` | Get logged-in user's test history | ✅ |
| GET | `/api/user/stats` | Get aggregated stats (avg WPM, best WPM, total tests) | ✅ |

---

### Leaderboard — `/api/leaderboard`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leaderboard` | Get top scores (filterable by duration) | ❌ |

**Query params for GET `/api/leaderboard`:**

| Param | Type | Description |
|-------|------|-------------|
| `duration` | Number | Filter by time mode (1, 2, 3, 5, 10) |
| `limit` | Number | Number of results to return (default: 10) |

---

## 🗄️ MongoDB Models

### User
| Field | Type | Description |
|-------|------|-------------|
| `username` | String | Unique display name |
| `email` | String | Unique email address |
| `password` | String | Bcrypt hashed password |
| `createdAt` | Date | Auto-generated timestamp |

---

### TestResult
| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to User (null for guests) |
| `wpm` | Number | Net words per minute |
| `accuracy` | Number | Accuracy percentage (0–100) |
| `duration` | Number | Test duration in seconds |
| `errors` | Number | Total error count |
| `wpmHistory` | [Number] | WPM recorded every second (for graph) |
| `paragraphId` | ObjectId | Reference to Paragraph used |
| `createdAt` | Date | Auto-generated timestamp |

---

### Paragraph
| Field | Type | Description |
|-------|------|-------------|
| `content` | String | The actual paragraph text |
| `difficulty` | String | `easy`, `medium`, or `hard` |
| `language` | String | Language code (e.g. `en`) |
| `wordCount` | Number | Auto-calculated on save |
| `suitableFor` | [Number] | Array of suitable time modes in minutes |
| `timesUsed` | Number | How many times this paragraph was used |
| `averageWpm` | Number | Rolling average WPM across all users |
| `isActive` | Boolean | Whether paragraph is available for use |

---

## 🌱 Seeding the Database

Paragraph data lives in `/data/paragraphs.json`. To seed:

```bash
npm run seed
```

This will insert all paragraphs from the JSON file into MongoDB. Existing paragraphs with the same content are skipped to avoid duplicates.

To reset and re-seed from scratch:

```bash
npm run seed:fresh
```

---

## 🔐 Authentication Flow

1. User registers → password is hashed with **bcrypt** → stored in MongoDB
2. User logs in → credentials verified → **JWT token** returned
3. Protected routes check the `Authorization: Bearer <token>` header
4. Token is decoded by `auth.middleware.js` → `req.user` is set
5. For `POST /api/test/submit`, auth is **optional** — if no token is present, the result is saved without a `userId` (guest result, not shown in history)

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT creation and verification |
| `dotenv` | Environment variable management |
| `cors` | Cross-origin resource sharing |
| `helmet` | Basic security headers |
| `express-validator` | Input validation |
| `nodemon` | Auto-restart in development |

---

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with nodemon (development) |
| `npm start` | Start server (production) |
| `npm run seed` | Seed paragraphs into MongoDB |
| `npm run seed:fresh` | Drop paragraphs collection and re-seed |

---

## 🔒 Security Notes

- Never commit your `.env` file — it is listed in `.gitignore`
- JWT secret should be at least 32 characters long
- Passwords are never stored in plain text
- All inputs are validated before reaching the database
- `helmet` middleware adds basic HTTP security headers



## 👤 Author

Built by **Vansh Kumar Patel**  
Project: **TypSwift** — A fast, clean typing speed test app