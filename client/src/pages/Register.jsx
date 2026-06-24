import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setError('')
    setSubmitting(true)

    const res = await register(name, email, password)
    
    if (res.success) {
      navigate('/')
    } else {
      setError(res.error)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Create an Account</h2>
          <p className="text-sm text-gray-500 font-normal">Get started with FreelanceOS free</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white font-normal outline-none transition-colors duration-200"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white font-normal outline-none transition-colors duration-200"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white font-normal outline-none transition-colors duration-200"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:opacity-50 cursor-pointer text-sm"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-[#ffffff08]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#10B981] hover:text-[#059669] font-semibold transition-colors duration-200">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
