import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' })

  // Fetch invoice details
  const fetchInvoice = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_URL}/${id}`)
      setInvoice(res.data.invoice)
    } catch (err) {
      console.error('Error fetching invoice details:', err)
      setError(err.response?.data?.error || 'Failed to load invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [id])

  // Handle Mark as Paid
  const handleMarkAsPaid = async () => {
    setUpdating(true)
    try {
      const res = await axios.patch(`${API_URL}/${id}/status`, { status: 'paid' })
      setInvoice(prev => ({ ...prev, status: res.data.invoice.status }))
    } catch (err) {
      console.error('Error updating status:', err)
      alert(err.response?.data?.error || 'Failed to update invoice status.')
    } finally {
      setUpdating(false)
    }
  }

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const response = await axios.get(`${API_URL}/${id}/pdf`, {
        responseType: 'arraybuffer'
      })
      // Create blob from arraybuffer
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber || 'draft'}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Delay clean up to let browser start the download stream before revoking URL
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 200)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // Handle Send Email
  const handleSendEmail = async () => {
    if (!invoice) return
    setSendingEmail(true)
    setEmailStatus({ type: '', message: '' })
    try {
      const res = await axios.post(`${API_URL}/${id}/send-email`)
      setEmailStatus({ type: 'success', message: res.data.message })
    } catch (err) {
      console.error('Error sending email:', err)
      setEmailStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to send invoice email. Please try again.' 
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return
    try {
      await axios.delete(`${API_URL}/${id}`)
      navigate('/invoices')
    } catch (err) {
      console.error('Error deleting invoice:', err)
      alert(err.response?.data?.error || 'Failed to delete invoice.')
    }
  }

  // Format Helper
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-500 max-w-3xl mx-auto">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-medium">Loading invoice details...</span>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 font-medium">
          {error || 'Invoice not found.'}
        </div>
        <Link to="/invoices" className="text-[#10B981] hover:underline text-sm font-semibold flex items-center gap-1.5">
          ← Back to Invoices
        </Link>
      </div>
    )
  }

  const freelancer = invoice.freelancerId || {}
  const client = invoice.clientId || {}
  const clientCurrency = client.currency || freelancer.currency || 'USD'
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Top Navigation & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to="/invoices" className="text-gray-400 hover:text-white text-sm font-semibold flex items-center gap-1.5 transition-colors duration-150">
          ← Back to Invoices
        </Link>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="border border-[#10B981]/30 hover:bg-[#10B981]/10 text-[#10B981] font-semibold text-xs px-4 py-2.5 rounded-md transition-colors duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {sendingEmail ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin"></span>
                Sending...
              </>
            ) : (
              <>
                <span>📧</span> Send Email
              </>
            )}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold text-xs px-4 py-2.5 rounded-md transition-colors duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {downloading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </>
            ) : (
              <>
                <span>📥</span> Download PDF
              </>
            )}
          </button>
          {invoice.status !== 'paid' && (
            <button
              onClick={handleMarkAsPaid}
              disabled={updating}
              className="bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] font-semibold text-xs px-4 py-2.5 rounded-md transition-colors duration-200 border border-[#10B981]/25 cursor-pointer disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Mark as Paid'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold text-xs px-4 py-2.5 rounded-md transition-colors duration-200 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Email Status Alert Callout */}
      {emailStatus.message && (
        <div className={`p-4 rounded-md text-sm font-medium border ${
          emailStatus.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {emailStatus.message}
        </div>
      )}

      {/* Invoice Document Box */}
      <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg p-8 sm:p-10 shadow-2xl space-y-10">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-[#ffffff08] pb-8">
          <div className="space-y-1.5">
            <span className="font-semibold text-2xl tracking-tight text-white">
              Freelance<span className="text-[#10B981]">OS</span>
            </span>
            <p className="text-gray-500 text-xs font-normal">Simplified Business Workspace</p>
          </div>
          <div className="sm:text-right space-y-1.5">
            <h2 className="text-xl font-semibold text-white">INVOICE</h2>
            <div className="text-sm font-medium text-gray-400 tracking-wider">
              {invoice.invoiceNumber}
            </div>
            <div className="pt-1.5">
              {invoice.status === 'paid' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Paid
                </span>
              ) : invoice.status === 'unpaid' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">
                  Unpaid
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          {/* Vendor Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">From</h4>
            <div className="space-y-1 text-gray-400">
              <div className="font-semibold text-white text-base">{freelancer.businessName || freelancer.name || 'Freelancer'}</div>
              {freelancer.address && <div className="text-xs leading-relaxed whitespace-pre-wrap">{freelancer.address}</div>}
              <div className="text-xs">{freelancer.email}</div>
              {freelancer.gstNumber && <div className="text-xs pt-1.5 font-medium text-gray-500">GSTIN: <span className="text-gray-400">{freelancer.gstNumber}</span></div>}
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">To</h4>
            <div className="space-y-1 text-gray-400">
              <div className="font-semibold text-white text-base">{client.name || 'Client'}</div>
              {client.companyName && <div className="text-xs font-medium text-[#10B981]">{client.companyName}</div>}
              {client.phone && <div className="text-xs">Phone: {client.phone}</div>}
              <div className="text-xs">{client.email}</div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Invoice Details</h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div className="text-gray-500 font-medium">Issue Date:</div>
              <div className="text-gray-300 font-semibold text-right sm:text-left">{formatDate(invoice.createdAt)}</div>
              <div className="text-gray-500 font-medium">Due Date:</div>
              <div className="text-gray-300 font-semibold text-right sm:text-left">{formatDate(invoice.dueDate)}</div>
              <div className="text-gray-500 font-medium">Currency:</div>
              <div className="text-gray-300 font-semibold text-right sm:text-left uppercase">{clientCurrency}</div>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="border border-[#ffffff08] rounded-lg overflow-hidden bg-[#0A0A0A]/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ffffff08] bg-[#0A0A0A]/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3.5">Service Description</th>
                <th className="px-5 py-3.5 text-right w-24">Rate</th>
                <th className="px-5 py-3.5 text-right w-20">Qty</th>
                <th className="px-5 py-3.5 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs sm:text-sm text-gray-300">
              {invoice.lineItems.map((item, idx) => (
                <tr key={item._id || idx} className="hover:bg-white/[0.005] transition-colors duration-150">
                  <td className="px-5 py-4 font-normal text-white">{item.service}</td>
                  <td className="px-5 py-4 text-right font-medium text-gray-400">
                    {getCurrencySymbol(clientCurrency)}{Number(item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right font-normal text-gray-400">{item.quantity}</td>
                  <td className="px-5 py-4 text-right font-semibold text-white">
                    {getCurrencySymbol(clientCurrency)}{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Block */}
        <div className="flex flex-col md:flex-row md:justify-between items-start gap-8 border-t border-[#ffffff08] pt-8">
          <div className="max-w-md w-full space-y-2">
            {invoice.notes && (
              <>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notes / Payment Terms</h4>
                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap bg-[#0A0A0A]/40 border border-[#ffffff08] rounded-md p-3.5">
                  {invoice.notes}
                </p>
              </>
            )}
          </div>
          <div className="w-full md:w-80">
            <div className="bg-[#0A0A0A]/40 border border-[#ffffff08] rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Invoice Subtotal</span>
                <span className="text-gray-300 font-semibold">{getCurrencySymbol(clientCurrency)}{Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-[#ffffff08] pt-4 flex justify-between items-center text-base">
                <span className="text-white font-semibold">Total Amount Due</span>
                <span className="text-[#10B981] font-bold text-lg">{getCurrencySymbol(clientCurrency)}{Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
