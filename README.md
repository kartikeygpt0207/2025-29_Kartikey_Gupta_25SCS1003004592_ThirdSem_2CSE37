# ConnectHub — Social Media Platform

A full-stack social media web application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- User registration, login, logout (JWT in httpOnly cookies)
- Create, view, and delete posts
- Personalized home feed (your posts + posts from users you follow)
- Like and unlike posts
- Add, list, and delete comments
- User profiles with edit support
- Follow / unfollow users
- Followers and following lists

## Technology Stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js, Express.js
- MongoDB, Mongoose
- JWT authentication, bcryptjs password hashing
- helmet, cors, express-rate-limit, express-validator

## Requirements

- Node.js 18+
- MongoDB 6+ (local or Atlas)

## Installation

1. Open the project folder:

```bash
cd social-media-app
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string and JWT secret.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/social-media-app` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your_secret_key_change_in_production` |
| `NODE_ENV` | Environment mode | `development` |

## Development

Ensure MongoDB is running, then start the server:

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

## Production

```bash
npm start
```

## Project Structure

```
social-media-app/
├── server/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── public/
│   ├── css/
│   ├── js/
│   └── *.html
├── .env.example
├── package.json
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user

### Users
- `GET /api/users/:id` — Profile
- `PUT /api/users/:id` — Update own profile
- `GET /api/users/:id/posts` — User posts
- `GET /api/users/:id/followers` — Followers list
- `GET /api/users/:id/following` — Following list
- `POST /api/users/:id/follow` — Follow user
- `DELETE /api/users/:id/follow` — Unfollow user

### Posts
- `GET /api/posts` — Personalized feed
- `POST /api/posts` — Create post
- `GET /api/posts/:id` — Single post
- `DELETE /api/posts/:id` — Delete own post
- `POST /api/posts/:id/like` — Like post
- `DELETE /api/posts/:id/like` — Unlike post
- `GET /api/posts/:postId/comments` — List comments
- `POST /api/posts/:postId/comments` — Add comment

### Comments
- `DELETE /api/comments/:id` — Delete own comment

### Health
- `GET /api/health` — Server health check

## Recommended Test Flow

1. Register two users
2. Log in as user A, create a post
3. Like and comment on the post
4. Visit user B's profile and follow them
5. Log in as user B, create a post
6. Log back in as user A — user B's post should appear in the feed
