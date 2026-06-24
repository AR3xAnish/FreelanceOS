# FreelanceOS

An all-in-one minimal workspace for freelancers to manage clients, invoices, and business analytics. Built using the MERN stack (MongoDB, Express, React, Node.js) with Tailwind CSS v4.

## Project Structure

```text
FreelanceOS/
├── client/          # Frontend React application (Vite + Tailwind CSS v4 + React Router)
├── server/          # Backend Node & Express API server (Mongoose)
└── README.md
```

## Features

- **Clients & Invoices**: Fast invoice creation and client billing details management.
- **Payment Tracking**: Simple payment tracking system.
- **Analytics**: Overview of revenue, expenses, and net profit.
- **System Health Monitor**: Pre-configured status checks between the frontend client and backend API.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a remote MongoDB Atlas connection)

### Installation

1. Clone the repository.
2. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```
3. Install dependencies for the client:
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the API Server**:
   Navigate to the `server/` directory and run:
   ```bash
   npm run dev
   ```
   The server will start on [http://localhost:5000](http://localhost:5000).

2. **Start the Client (React)**:
   Navigate to the `client/` directory and run:
   ```bash
   npm run dev
   ```
   The client application will start on [http://localhost:5173](http://localhost:5173).

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, React Router, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose, Dotenv, Cors
