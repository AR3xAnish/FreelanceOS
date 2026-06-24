import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import axios from 'axios'

// API base URL configuration
const API_URL = 'http://localhost:5000/api'

function Layout({ children }) {
  const [apiOnline, setApiOnline] = useState(null)

  useEffect(() => {
    axios.get(`${API_URL}/health`)
      .then(res => {
        if (res.data.status === 'ok') setApiOnline(true)
        else setApiOnline(false)
      })
      .catch(() => setApiOnline(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-200 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-[#ffffff08] bg-[#0A0A0A] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#10B981] flex items-center justify-center font-semibold text-[#0A0A0A] text-xs">
              F
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Freelance<span className="text-[#10B981]">OS</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#10B981]' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#10B981]' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              About
            </NavLink>
            <button className="bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] text-sm font-semibold px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ffffff08] bg-[#0A0A0A] py-10 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FreelanceOS. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">API Status:</span>
            {apiOnline === null ? (
              <span className="w-2 h-2 rounded-full bg-gray-600 inline-block"></span>
            ) : apiOnline ? (
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            )}
            <span className="text-gray-400 font-medium">
              {apiOnline === null ? 'checking...' : apiOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-20 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
          Run Your Freelance Business Like a Pro
        </h1>
        <p className="text-gray-500 text-lg md:text-xl font-normal leading-relaxed">
          The all-in-one platform for freelancers to manage clients, invoices, and analytics.
        </p>
        
        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold px-6 py-3 rounded-md transition-colors duration-200 cursor-pointer">
            Get Started Free
          </button>
          <button className="w-full sm:w-auto bg-transparent border border-gray-800 hover:border-gray-600 text-gray-300 font-semibold px-6 py-3 rounded-md transition-colors duration-200 cursor-pointer">
            View Demo
          </button>
        </div>

        {/* Stats Pills */}
        <div className="pt-8 flex justify-center items-center gap-2.5 text-xs text-gray-500 md:text-sm">
          <span>500+ Freelancers</span>
          <span className="text-gray-700 font-bold">·</span>
          <span>10k+ Invoices Sent</span>
          <span className="text-gray-700 font-bold">·</span>
          <span>4.9★ Rating</span>
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1: Clients & Invoices */}
        <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg p-6 flex flex-col justify-between space-y-4 hover:border-gray-800 transition-colors duration-200">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#10B981]/10 flex items-center justify-center text-lg text-[#10B981]">
              📄
            </div>
            <h3 className="font-semibold text-lg text-white">Clients & Invoices</h3>
            <p className="text-sm font-normal text-gray-500 leading-relaxed">
              Create and send professional invoices in 30 seconds.
            </p>
          </div>
        </div>

        {/* Card 2: Payment Tracking */}
        <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg p-6 flex flex-col justify-between space-y-4 hover:border-gray-800 transition-colors duration-200">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#10B981]/10 flex items-center justify-center text-lg text-[#10B981]">
              💳
            </div>
            <h3 className="font-semibold text-lg text-white">Payment Tracking</h3>
            <p className="text-sm font-normal text-gray-500 leading-relaxed">
              Know exactly who owes you and when.
            </p>
          </div>
        </div>

        {/* Card 3: Analytics */}
        <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg p-6 flex flex-col justify-between space-y-4 hover:border-gray-800 transition-colors duration-200">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#10B981]/10 flex items-center justify-center text-lg text-[#10B981]">
              📈
            </div>
            <h3 className="font-semibold text-lg text-white">Analytics</h3>
            <p className="text-sm font-normal text-gray-500 leading-relaxed">
              See your revenue, expenses and net profit at a glance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-white">About FreelanceOS</h1>
        <p className="text-gray-500 text-sm">Our mission and framework architecture.</p>
      </div>

      <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg p-8 text-gray-400 space-y-6 leading-relaxed">
        <p>
          FreelanceOS is designed to serve as a comprehensive workspace dashboard for freelancers. 
          By unifying task management, client tracking, and invoicing in one platform, it streamlines business operations.
        </p>
        <p>
          This project runs on a full MERN stack. The backend is built with Node, Express, and Mongoose for MongoDB. 
          The frontend is powered by React, bundled with Vite, styled with Tailwind CSS, navigated with React Router, and connects to the backend via Axios.
        </p>
      </div>
      
      <div>
        <Link to="/" className="inline-flex items-center justify-center bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold px-5 py-2.5 rounded-md transition-colors duration-200 cursor-pointer text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
