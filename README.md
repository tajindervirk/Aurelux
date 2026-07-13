<div align="center">
  
# 🎬 Aurelux 

A premium, full-stack media discovery platform built with the MERN stack. Aurelux allows users to explore trending movies, top-rated TV shows, and popular anime, all wrapped in a stunning, highly-animated user interface.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)

</div>

## ✨ Features

- **Media Discovery:** Browse thousands of movies, TV shows, and anime fetched dynamically using the TMDB API.
- **Secure Authentication:** Robust user authentication utilizing JWT (JSON Web Tokens) secured via HttpOnly cookies and bcrypt password hashing.
- **Personalized Dashboards:** Users can create custom watchlists, save favorites, and track their browsing history.
- **Premium Aesthetics:** A sleek, dark-mode-first UI featuring glassmorphism, smooth page transitions, and micro-animations powered by Framer Motion and GSAP.
- **Mobile First & Responsive:** Fully optimized for seamless viewing across all desktop, tablet, and mobile devices.
- **Rate Limiting & Security:** Backend protected against brute-force attacks via `express-rate-limit` and secured with Helmet CSP headers.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js (Bootstrapped with Vite for instant HMR)
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM
- **Animations:** Framer Motion, GSAP, React Three Fiber
- **Styling:** Pure Vanilla CSS (Responsive, Flexbox/Grid, Custom Tokens)
- **Data Fetching:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** jsonwebtoken (JWT), bcryptjs
- **Security:** Helmet, CORS, Express Rate Limit
- **API Integration:** TMDB (The Movie Database) Reverse Proxy

## 🚀 Getting Started (Local Development)

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Database (Local or MongoDB Atlas)
- TMDB API Key

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/aurelux.git
   cd aurelux
   ```

2. **Setup the Backend**
   ```sh
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d
   TMDB_API_KEY=your_tmdb_api_key
   TMDB_READ_TOKEN=your_tmdb_read_token
   NODE_ENV=development
   ```
   Start the backend server:
   ```sh
   npm start
   ```

3. **Setup the Frontend**
   Open a new terminal window:
   ```sh
   cd frontend
   npm install
   ```
   Create a `.env.local` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p/
   ```
   Start the Vite development server:
   ```sh
   npm run dev
   ```

## 🔒 Security Architecture
Aurelux implements an industry-standard reverse proxy pattern. Client-side requests to TMDB are routed through the local Express server. The backend securely injects the private TMDB access tokens and forwards the requests to the TMDB API, ensuring sensitive API keys are never exposed to the public browser network tab.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
