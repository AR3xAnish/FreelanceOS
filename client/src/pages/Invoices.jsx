import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api/invoices'

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

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch all invoices (with filter by status if applicable)
  const fetchInvoices = async (status) => {
    setLoading(true)
    setError('')
    try {
      const url = status && status !== 'all' ? `${API_URL}?status=${status}` : API_URL
      const res = await axios.get(url)
      setInvoices(res.data.invoices || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(err.response?.data?.error || 'Failed to load invoices. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices(statusFilter)
  }, [statusFilter])

  // Handle Mark as Paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const res = await axios.patch(`${API_URL}/${invoiceId}/status`, { status: 'paid' })
      setInvoices(prev => prev.map(inv => inv._id === invoiceId ? { ...inv, status: res.data.invoice.status } : inv))
    } catch (err) {
      console.error('Error updating invoice status:', err)
      alert(err.response?.data?.error || 'Failed to update invoice status.')
    }
  }

  // Handle Delete
  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return

    try {
      await axios.delete(`${API_URL}/${invoiceId}`)
      setInvoices(prev => prev.filter(inv => inv._id !== invoiceId))
    } catch (err) {
      console.error('Error deleting invoice:', err)
      alert(err.response?.data?.error || 'Failed to delete invoice.')
    }
  }

  // Helper formatting values
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Invoices</h1>
          <p className="text-gray-500 text-sm font-normal">Track your invoice items, payments, and client billing histories.</p>
        </div>
        <Link
          to="/invoices/create"
          className="bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold text-sm px-4.5 py-2.5 rounded-md transition-colors duration-200 cursor-pointer self-start sm:self-center text-center"
        >
          Create Invoice
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ffffff08] pb-1">
        {['all', 'unpaid', 'paid', 'overdue'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-md border-b-2 capitalize transition-all duration-200 cursor-pointer ${
              statusFilter === filter
                ? 'text-[#10B981] border-[#10B981] bg-[#10B981]/5'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Main invoices list */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-sm font-medium">Loading invoices...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-12 text-center text-gray-500 space-y-4">
          <div className="text-4xl text-gray-600">📄</div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-lg">No invoices found</h3>
            <p className="text-sm">Get started by creating your first business invoice.</p>
          </div>
          <Link
            to="/invoices/create"
            className="inline-flex bg-[#10B981]/10 hover:bg-[#10B981]/25 text-[#10B981] font-semibold text-sm px-4 py-2 rounded-md transition-colors duration-200 border border-[#10B981]/20 cursor-pointer"
          >
            Create Invoice
          </Link>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ffffff08] bg-[#0A0A0A]/40 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffffff08] text-sm text-gray-300 font-normal">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-white/[0.01] transition-colors duration-150">
                    <td className="px-6 py-4 font-semibold text-white tracking-wider">
                      <Link to={`/invoices/${inv._id}`} className="text-[#10B981] hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {inv.clientId ? (
                        <div>
                          <div className="font-medium text-white">{inv.clientId.name}</div>
                          {inv.clientId.companyName && (
                            <div className="text-xs text-gray-500">{inv.clientId.companyName}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">Unknown Client</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {getCurrencySymbol(inv.clientId?.currency || 'USD')}{inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Paid
                          </span>
                        ) : inv.status === 'unpaid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Unpaid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            Overdue
                          </span>
                        )}
                        {inv.approvalStatus === 'rejected' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20" title={inv.rejectionReason}>
                            Rejected
                          </span>
                        )}
                        {inv.approvalStatus === 'approved' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3.5">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(inv._id)}
                          className="text-[#10B981] hover:text-[#059669] font-semibold transition-colors duration-200 cursor-pointer"
                        >
                          Mark as Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inv._id)}
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
  )
}
