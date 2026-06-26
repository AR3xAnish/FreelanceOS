import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api/portal'

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

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingInvoice, setRejectingInvoice] = useState(null)
  const [rejectionReasonText, setRejectionReasonText] = useState('')
  const [submittingRejection, setSubmittingRejection] = useState(false)

  const fetchPortalData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/${token}`)
      setData(res.data)
    } catch (err) {
      console.error('Error fetching client portal data:', err)
      setError(err.response?.data?.error || 'Failed to load portal details. Access link may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchPortalData()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-gray-200 flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-medium text-gray-400">Loading secure client portal...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-gray-200 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#111111] border border-red-500/20 p-8 rounded-lg shadow-xl text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold text-white">Access Denied</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {error || 'This secure client portal link is no longer valid. Please contact your freelancer for a new link.'}
          </p>
        </div>
      </div>
    )
  }

  const { client, invoices } = data
  const freelancer = client.freelancerId || {}
  const currencySymbol = getCurrencySymbol(client.currency || 'USD')

  // Calculate total outstanding amount (unpaid or overdue invoices)
  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

  // Handle PDF Download
  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    setDownloadingId(invoiceId)
    try {
      const response = await axios.get(`${API_BASE}/${token}/invoices/${invoiceId}/pdf`, {
        responseType: 'arraybuffer'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceNumber || 'draft'}.pdf`
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 200)
    } catch (err) {
      console.error('Error downloading invoice PDF:', err)
      alert('Failed to download PDF copy. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  // Handle Invoice Approval
  const handleApproveInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to approve this invoice?')) return
    setApprovingId(invoiceId)
    try {
      await axios.patch(`${API_BASE}/${token}/invoices/${invoiceId}/approve`)
      // Refresh local page state data
      setData(prev => ({
        ...prev,
        invoices: prev.invoices.map(inv => inv._id === invoiceId ? { ...inv, approvalStatus: 'approved' } : inv)
      }))
    } catch (err) {
      console.error('Error approving invoice:', err)
      alert('Failed to approve invoice. Please try again.')
    } finally {
      setApprovingId(null)
    }
  }

  // Handle Invoice Rejection
  const handleRejectInvoice = async (e) => {
    e.preventDefault()
    if (!rejectionReasonText.trim()) {
      alert('Please enter a rejection reason.')
      return
    }
    setSubmittingRejection(true)
    try {
      await axios.patch(`${API_BASE}/${token}/invoices/${rejectingInvoice._id}/reject`, {
        reason: rejectionReasonText.trim()
      })
      // Refresh local page state data
      setData(prev => ({
        ...prev,
        invoices: prev.invoices.map(inv => inv._id === rejectingInvoice._id ? { ...inv, approvalStatus: 'rejected', rejectionReason: rejectionReasonText.trim() } : inv)
      }))
      setRejectingInvoice(null)
      setRejectionReasonText('')
    } catch (err) {
      console.error('Error rejecting invoice:', err)
      alert(err.response?.data?.error || 'Failed to reject invoice. Please try again.')
    } finally {
      setSubmittingRejection(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-200 flex flex-col font-sans antialiased">
      {/* Portal Header */}
      <header className="border-b border-[#ffffff08] bg-[#0A0A0A]/80 sticky top-0 z-50 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#10B981] flex items-center justify-center font-semibold text-[#0A0A0A] text-xs">
              F
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Freelance<span className="text-[#10B981]">OS</span> Client Portal
            </span>
          </div>
          <span className="text-xs bg-[#ffffff05] border border-[#ffffff08] px-3 py-1 rounded-full text-gray-400 font-semibold uppercase tracking-wider">
            Secure Link Verified
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="grow max-w-5xl w-full mx-auto px-6 py-12 space-y-10">
        {/* Welcome Section & KPI Outstanding Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-2.5">
            <h1 className="text-3xl font-semibold tracking-tight text-white">Hello, {client.name}</h1>
            <p className="text-gray-500 text-sm font-normal">
              Review and manage invoices issued to you by <strong className="text-gray-300">{freelancer.businessName || freelancer.name || 'Freelancer'}</strong>.
            </p>
          </div>
          <div className="bg-[#111111] border border-[#ffffff08] border-l-4 border-l-[#10B981] rounded-r-lg p-5 shadow-lg space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">Total Outstanding Balance</span>
            <div className="text-2xl font-bold text-white tracking-tight">
              {currencySymbol}{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Business details layout card */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-4 shadow-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Service Provider details</h3>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="font-semibold text-white text-sm">{freelancer.businessName || freelancer.name}</div>
              {freelancer.address && <div className="leading-relaxed whitespace-pre-wrap">{freelancer.address}</div>}
              <div>Email: {freelancer.email}</div>
              {freelancer.gstNumber && <div className="text-gray-500 pt-1">GSTIN: {freelancer.gstNumber}</div>}
            </div>
          </div>

          <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-4 shadow-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client billing details</h3>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="font-semibold text-white text-sm">{client.name}</div>
              {client.companyName && <div className="text-[#10B981]">{client.companyName}</div>}
              {client.phone && <div>Phone: {client.phone}</div>}
              <div>Email: {client.email}</div>
            </div>
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg overflow-hidden shadow-xl">
          <div className="p-6 border-b border-[#ffffff08]">
            <h3 className="font-semibold text-white text-base">Invoices Summary</h3>
          </div>
          
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              No invoices have been issued to your client portal yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ffffff08] bg-[#0A0A0A]/40 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4">Invoice No.</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Approval</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ffffff08] text-xs sm:text-sm text-gray-300 font-normal">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-white/[0.005] transition-colors duration-150">
                      <td className="px-6 py-4 font-semibold text-white">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">{new Date(inv.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : inv.status === 'overdue'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.approvalStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <span>✓</span> Approved
                          </span>
                        ) : inv.approvalStatus === 'rejected' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
                              <span>✗</span> Rejected
                            </span>
                            {inv.rejectionReason && (
                              <div className="text-[11px] text-gray-500 max-w-[180px] sm:max-w-xs leading-tight break-words">
                                Reason: <span className="text-gray-400 italic">"{inv.rejectionReason}"</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Pending Approval</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-white">
                        {currencySymbol}{inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {inv.status !== 'paid' && inv.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveInvoice(inv._id)}
                              disabled={approvingId === inv._id}
                              className="bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] font-semibold text-xs px-3 py-1.5 rounded border border-[#10B981]/25 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingInvoice(inv)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs px-3 py-1.5 rounded border border-red-500/20 transition-colors duration-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                          disabled={downloadingId === inv._id}
                          className="bg-[#ffffff05] hover:bg-[#ffffff08] border border-[#ffffff08] text-gray-300 font-semibold text-xs px-3 py-1.5 rounded transition-colors duration-200 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {downloadingId === inv._id ? (
                            <>
                              <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <span>📥</span> Download PDF
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ffffff08] bg-[#0A0A0A] py-8 text-center text-xs text-gray-500">
        <p>© 2026 FreelanceOS. Protected by secure link access authentication.</p>
      </footer>

      {/* Rejection Modal */}
      {rejectingInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#111111] border border-[#ffffff08] rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Reject Invoice {rejectingInvoice.invoiceNumber}</h3>
              <button 
                onClick={() => setRejectingInvoice(null)}
                className="text-gray-500 hover:text-white cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleRejectInvoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block" htmlFor="rejectionReason">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejectionReason"
                  rows="4"
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="Provide a reason why this invoice is being rejected..."
                  className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-red-500 rounded-md px-3.5 py-2.5 text-sm text-white outline-none transition-colors duration-200 font-normal resize-none"
                  required
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingInvoice(null)}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-600 rounded-md text-xs font-semibold text-gray-300 transition-colors duration-200 text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRejection || !rejectionReasonText.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {submittingRejection ? 'Rejecting...' : 'Reject Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
