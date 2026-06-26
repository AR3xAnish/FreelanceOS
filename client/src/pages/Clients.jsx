import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api/clients'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null) // null for Add, client object for Edit
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [modalError, setModalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Client Portal modal states
  const [portalModalOpen, setPortalModalOpen] = useState(false)
  const [portalClient, setPortalClient] = useState(null)
  const [generatingPortal, setGeneratingPortal] = useState(false)
  const [portalError, setPortalError] = useState('')
  const [portalLink, setPortalLink] = useState('')
  const [portalCopied, setPortalCopied] = useState(false)

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(API_URL)
      setClients(res.data.clients || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err.response?.data?.error || 'Failed to load clients. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingClient(null)
    setName('')
    setEmail('')
    setPhone('')
    setCompanyName('')
    setCurrency('USD')
    setModalError('')
    setModalOpen(true)
  }

  // Open modal for edit
  const handleOpenEdit = (client) => {
    setEditingClient(client)
    setName(client.name || '')
    setEmail(client.email || '')
    setPhone(client.phone || '')
    setCompanyName(client.companyName || '')
    setCurrency(client.currency || 'USD')
    setModalError('')
    setModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingClient(null)
  }

  // Handle Form submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email) {
      setModalError('Name and Email are required fields.')
      return
    }

    setModalError('')
    setSubmitting(true)

    const clientData = { name, email, phone, companyName, currency }

    try {
      if (editingClient) {
        // Edit Client
        const res = await axios.put(`${API_URL}/${editingClient._id}`, clientData)
        setClients(prev => prev.map(c => c._id === editingClient._id ? res.data.client : c))
      } else {
        // Add Client
        const res = await axios.post(API_URL, clientData)
        setClients(prev => [res.data.client, ...prev])
      }
      handleCloseModal()
    } catch (err) {
      console.error('Submit client error:', err)
      setModalError(err.response?.data?.error || 'Failed to save client details.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Client Portal Generation & Link Copy
  const handleSendPortal = async (client) => {
    setPortalClient(client)
    setPortalError('')
    setPortalLink('')
    setPortalCopied(false)
    setGeneratingPortal(true)
    setPortalModalOpen(true)

    try {
      const res = await axios.post(`${API_URL}/${client._id}/send-portal`)
      setPortalLink(res.data.portalLink)
      setClients(prev => prev.map(c => c._id === client._id ? { ...c, portalToken: res.data.portalToken } : c))
    } catch (err) {
      console.error('Error generating portal link:', err)
      setPortalError(err.response?.data?.error || 'Failed to generate portal link.')
    } finally {
      setGeneratingPortal(false)
    }
  }

  const handleCopyLink = () => {
    if (!portalLink) return
    navigator.clipboard.writeText(portalLink)
    setPortalCopied(true)
    setTimeout(() => setPortalCopied(false), 2000)
  }

  const handleClosePortalModal = () => {
    setPortalModalOpen(false)
    setPortalClient(null)
  }

  // Handle Delete
  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return

    try {
      await axios.delete(`${API_URL}/${clientId}`)
      setClients(prev => prev.filter(c => c._id !== clientId))
    } catch (err) {
      console.error('Delete client error:', err)
      alert(err.response?.data?.error || 'Failed to delete client.')
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Clients</h1>
          <p className="text-gray-500 text-sm font-normal">Manage your client profiles, currencies, and billing details.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold text-sm px-4.5 py-2.5 rounded-md transition-colors duration-200 cursor-pointer self-start sm:self-center"
        >
          Add Client
        </button>
      </div>

      {/* Main clients section */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-sm font-medium">Loading clients...</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-12 text-center text-gray-500 space-y-4">
          <div className="text-4xl text-gray-600">👥</div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-lg">No clients found</h3>
            <p className="text-sm">Get started by creating your first client profile.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex bg-[#10B981]/10 hover:bg-[#10B981]/25 text-[#10B981] font-semibold text-sm px-4 py-2 rounded-md transition-colors duration-200 border border-[#10B981]/20 cursor-pointer"
          >
            Create Client
          </button>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ffffff08] bg-[#0A0A0A]/40 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffffff08] text-sm text-gray-300 font-normal">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-white/[0.01] transition-colors duration-150">
                    <td className="px-6 py-4 font-semibold text-white">{client.name}</td>
                    <td className="px-6 py-4">{client.email}</td>
                    <td className="px-6 py-4">{client.companyName || <span className="text-gray-600">—</span>}</td>
                    <td className="px-6 py-4 font-medium text-gray-400">{client.currency}</td>
                    <td className="px-6 py-4 text-right space-x-3.5">
                      <button
                        onClick={() => handleSendPortal(client)}
                        className="text-emerald-400 hover:text-emerald-500 font-semibold transition-colors duration-200 cursor-pointer"
                      >
                        Portal
                      </button>
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="text-[#10B981] hover:text-[#059669] font-semibold transition-colors duration-200 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="text-red-400 hover:text-red-500 font-semibold transition-colors duration-200 cursor-pointer"
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

      {/* Add / Edit Client Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#ffffff08] pb-3">
              <h3 className="text-lg font-semibold text-white">
                {editingClient ? 'Edit Client Details' : 'Add New Client'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-white transition-colors duration-200 cursor-pointer text-xl line-none"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block" htmlFor="clientName">
                  Client Name *
                </label>
                <input
                  id="clientName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                  placeholder="e.g. Acme Corp Contact"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block" htmlFor="clientEmail">
                  Email Address *
                </label>
                <input
                  id="clientEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block" htmlFor="clientPhone">
                  Phone Number
                </label>
                <input
                  id="clientPhone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                  placeholder="e.g. +1 555-0199"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block" htmlFor="clientCompany">
                  Company Name
                </label>
                <input
                  id="clientCompany"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                  placeholder="e.g. Acme Corporation"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block" htmlFor="clientCurrency">
                  Billing Currency
                </label>
                <select
                  id="clientCurrency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ffffff08]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-600 rounded-md text-xs font-semibold text-gray-300 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold rounded-md text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Portal Link Modal */}
      {portalModalOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#ffffff08] border-t-2 border-t-[#10B981] rounded-lg w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#ffffff08] pb-3">
              <h3 className="text-lg font-semibold text-white">Client Portal Access</h3>
              <button
                onClick={handleClosePortalModal}
                className="text-gray-500 hover:text-white transition-colors duration-200 cursor-pointer text-xl line-none"
              >
                &times;
              </button>
            </div>

            {generatingPortal ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-500 space-y-3">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Generating link and sending email...</span>
              </div>
            ) : portalError ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 font-medium">
                {portalError}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl">📧</div>
                  <h4 className="text-sm font-semibold text-white">Portal link successfully sent!</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    An email with a secure link was sent to <strong className="text-gray-200">{portalClient?.email}</strong>. 
                    They can view and approve invoices without needing a password.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[#ffffff08]">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Copy Portal Link Manually
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={portalLink}
                      className="grow bg-[#0A0A0A] border border-[#ffffff08] rounded-md px-3 py-1.5 text-xs text-gray-300 outline-none select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer whitespace-nowrap min-w-[70px]"
                    >
                      {portalCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#ffffff08]">
              <button
                onClick={handleClosePortalModal}
                className="px-4 py-2 border border-gray-800 hover:border-gray-600 rounded-md text-xs font-semibold text-gray-300 transition-colors duration-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
