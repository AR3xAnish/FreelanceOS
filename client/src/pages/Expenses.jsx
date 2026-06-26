import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/expenses'

const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥'
  };
  return symbols[currencyCode] || currencyCode + ' ';
};

export default function Expenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [category, setCategory] = useState('software')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  const fetchExpenses = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(API_URL)
      setExpenses(res.data.expenses || [])
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err.response?.data?.error || 'Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category || !amount || !date) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await axios.post(API_URL, {
        category,
        amount: parseFloat(amount),
        date,
        note
      })
      setExpenses(prev => [res.data.expense, ...prev])
      // Reset form fields
      setAmount('')
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
    } catch (err) {
      console.error('Error logging expense:', err)
      setError(err.response?.data?.error || 'Failed to log expense.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await axios.delete(`${API_URL}/${id}`)
      setExpenses(prev => prev.filter(exp => exp._id !== id))
    } catch (err) {
      console.error('Error deleting expense:', err)
      alert(err.response?.data?.error || 'Failed to delete expense.')
    }
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getCategoryLabel = (cat) => {
    const labels = {
      software: 'Software',
      hardware: 'Hardware',
      travel: 'Travel',
      food: 'Food',
      other: 'Other'
    }
    return labels[cat] || cat
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Expenses</h1>
        <p className="text-gray-500 text-sm font-normal">Track your business expenditures, software tool license costs, and equipment fees.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-red-500/80 rounded-lg p-6 space-y-2 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Expenses</span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {getCurrencySymbol(user?.currency || 'USD')}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-gray-600">Calculated from {expenses.length} logs</p>
        </div>
      </div>

      {/* Split layout: Log Form & Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Log Form Card */}
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-6 lg:col-span-1 shadow-xl">
          <h3 className="font-semibold text-lg text-white border-b border-[#ffffff08] pb-3">Log Expense</h3>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2.5 text-sm text-white outline-none cursor-pointer"
              >
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="travel">Travel</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="amount">
                Amount ({getCurrencySymbol(user?.currency || 'USD')})
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white font-normal outline-none transition-colors duration-200"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white font-normal outline-none transition-colors duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="note">
                Note / Description
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white font-normal outline-none transition-colors duration-200 resize-none"
                placeholder="License key, client trip, lunch, etc."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:opacity-50 cursor-pointer text-sm"
            >
              {submitting ? 'Logging...' : 'Log Expense'}
            </button>
          </form>
        </div>

        {/* Expenses List Card */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-[#111111] border border-[#ffffff08] rounded-lg">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="text-sm font-medium">Loading expenditures...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-12 text-center text-gray-500 space-y-3">
              <div className="text-4xl text-gray-600">💳</div>
              <h3 className="font-semibold text-white text-lg">No expenses logged</h3>
              <p className="text-sm max-w-sm mx-auto">Keep track of software licenses, client travel, hosting fees, and other business items here.</p>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#ffffff08] rounded-lg overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ffffff08] bg-[#0A0A0A]/40 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Note</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ffffff08] text-sm text-gray-300 font-normal">
                    {expenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-white/[0.01] transition-colors duration-150">
                        <td className="px-6 py-4 text-gray-400">{formatDate(exp.date)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-500/10 text-gray-300 border border-gray-500/20 capitalize">
                            {getCategoryLabel(exp.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-gray-300 font-light" title={exp.note}>
                          {exp.note || <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-white">
                          {getCurrencySymbol(user?.currency || 'USD')}{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="text-red-400 hover:text-red-500 font-semibold transition-colors duration-200 cursor-pointer text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
