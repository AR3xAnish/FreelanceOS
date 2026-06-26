import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const CLIENTS_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/clients'
const INVOICES_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/invoices'

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

export default function CreateInvoice() {
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState([
    { service: '', quantity: 1, rate: 0 }
  ])

  const navigate = useNavigate()

  const selectedClient = clients.find(c => c._id === clientId)
  const clientCurrency = selectedClient?.currency || 'USD'

  // Load clients & invoice details if edit mode
  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Fetch clients list
        const clientsRes = await axios.get(CLIENTS_API)
        const clientsList = clientsRes.data.clients || []
        setClients(clientsList)

        // 2. Fetch invoice details if editing
        if (isEditMode) {
          const invoiceRes = await axios.get(`${INVOICES_API}/${id}`)
          const inv = invoiceRes.data.invoice
          if (inv) {
            setClientId(inv.clientId?._id || inv.clientId)
            setNotes(inv.notes || '')
            setLineItems(inv.lineItems.map(item => ({
              service: item.service,
              quantity: item.quantity,
              rate: item.rate
            })))
            
            // Format UTC/ISO dueDate cleanly to YYYY-MM-DD input default representation
            const d = new Date(inv.dueDate)
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            setDueDate(`${year}-${month}-${day}`)
          }
        } else if (clientsList.length > 0) {
          setClientId(clientsList[0]._id) // default select first client
        }
      } catch (err) {
        console.error('Error initializing page data:', err)
        setError(isEditMode ? 'Failed to fetch invoice details.' : 'Failed to fetch clients list. Please create a client first.')
      } finally {
        setLoadingClients(false)
      }
    }
    initPage()
  }, [id, isEditMode])

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev]
      if (field === 'quantity') {
        updated[index][field] = parseInt(value, 10) || 0
      } else if (field === 'rate') {
        updated[index][field] = parseFloat(value) || 0
      } else {
        updated[index][field] = value
      }
      return updated
    })
  }

  const handleAddItem = () => {
    setLineItems(prev => [...prev, { service: '', quantity: 1, rate: 0 }])
  }

  const handleRemoveItem = (index) => {
    if (lineItems.length === 1) return // Keep at least one line item
    setLineItems(prev => prev.filter((_, idx) => idx !== index))
  }

  // Calculate dynamic totals
  const calculateLineAmount = (item) => {
    return (item.quantity || 0) * (item.rate || 0)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + calculateLineAmount(item), 0)
  }

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clientId) {
      setError('Please select a client.')
      return
    }
    if (!dueDate) {
      setError('Please select a due date.')
      return
    }
    if (lineItems.some(item => !item.service || item.quantity <= 0 || item.rate < 0)) {
      setError('Please provide valid descriptions and rates for all line items.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      if (isEditMode) {
        await axios.put(`${INVOICES_API}/${id}`, {
          clientId,
          lineItems,
          dueDate,
          notes
        })
        navigate(`/invoices/${id}`)
      } else {
        await axios.post(INVOICES_API, {
          clientId,
          lineItems,
          dueDate,
          notes,
          status: 'unpaid'
        })
        navigate('/invoices')
      }
    } catch (err) {
      console.error('Error saving invoice:', err)
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'save' : 'create'} invoice. Please try again.`)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header & Back Link */}
      <div className="space-y-2">
        <Link to="/invoices" className="text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors duration-200">
          &larr; Back to Invoices
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {isEditMode ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
        <p className="text-gray-500 text-sm font-normal">
          {isEditMode ? 'Modify this invoice details and save to resubmit for review.' : 'Build a detailed client invoice with custom services and rates.'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {loadingClients ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-sm font-medium">Loading client information...</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-12 text-center text-gray-500 space-y-4">
          <div className="text-4xl text-gray-600">👥</div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-lg">No clients available</h3>
            <p className="text-sm">You must create a client profile before building invoices.</p>
          </div>
          <Link
            to="/clients"
            className="inline-flex bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold text-sm px-4 py-2.5 rounded-md transition-colors duration-200 cursor-pointer"
          >
            Create Client
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#111111] border border-[#ffffff08] rounded-lg p-8 space-y-8 shadow-xl">
          {/* Client & Due Date Settings */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="invoiceClient">
                Select Client *
              </label>
              <select
                id="invoiceClient"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white outline-none transition-colors duration-200 font-normal cursor-pointer"
                required
              >
                {clients.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="invoiceDueDate">
                Due Date *
              </label>
              <input
                id="invoiceDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Line Items</h3>
              <span className="text-xs font-semibold text-gray-400 bg-[#0A0A0A] border border-[#ffffff08] px-2.5 py-1 rounded-md">
                Currency: <span className="text-[#10B981]">{clientCurrency} ({getCurrencySymbol(clientCurrency)})</span>
              </span>
            </div>

            {/* Desktop Table Headers */}
            <div className="hidden md:grid grid-cols-12 gap-3 pb-2 border-b border-[#ffffff08] text-xs font-semibold text-gray-400">
              <div className="col-span-5">Service Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Rate ({getCurrencySymbol(clientCurrency).trim()})</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center border-b border-[#ffffff08] pb-3 md:border-b-0 md:pb-0">
                  <div className="col-span-12 md:col-span-5 space-y-1 md:space-y-0">
                    <label className="text-[10px] font-semibold text-gray-500 block md:hidden">Service Description</label>
                    <input
                      type="text"
                      value={item.service}
                      onChange={(e) => handleItemChange(index, 'service', e.target.value)}
                      placeholder="e.g. Design Consulting"
                      className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                      required
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2 space-y-1 md:space-y-0">
                    <label className="text-[10px] font-semibold text-gray-500 block md:hidden">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                      required
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2 space-y-1 md:space-y-0">
                    <label className="text-[10px] font-semibold text-gray-500 block md:hidden">
                      Rate ({getCurrencySymbol(clientCurrency).trim()})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      placeholder="Rate"
                      className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal"
                      required
                    />
                  </div>

                  <div className="col-span-3 md:col-span-2 text-right font-medium text-white text-sm">
                    <label className="text-[10px] font-semibold text-gray-500 block md:hidden">Total</label>
                    <div className="py-2 md:py-0">
                      {getCurrencySymbol(clientCurrency)}{calculateLineAmount(item).toFixed(2)}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={lineItems.length === 1}
                      className="text-red-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-30 cursor-pointer text-base select-none leading-none pt-2 md:pt-0"
                      title="Remove Item"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#10B981]/25 hover:bg-[#10B981]/5 text-[#10B981] font-semibold text-xs rounded-md transition-colors duration-200 cursor-pointer"
            >
              + Add Item
            </button>
          </div>

          {/* Notes & Grand Total Footer */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-6 border-t border-[#ffffff08]">
            <div className="w-full md:max-w-md space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block" htmlFor="invoiceNotes">
                Invoice Notes / Payment Terms
              </label>
              <textarea
                id="invoiceNotes"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bank details, payment terms, or a thank you message..."
                className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2 text-sm text-white outline-none transition-colors duration-200 font-normal resize-y"
              />
            </div>

            <div className="w-full md:w-auto text-right space-y-2 self-end">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Grand Total</div>
              <div className="text-3xl font-bold text-white">{getCurrencySymbol(clientCurrency)}{calculateTotal().toFixed(2)}</div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-4 border-t border-[#ffffff08] pt-6">
            <Link
              to="/invoices"
              className="px-5 py-2.5 border border-gray-800 hover:border-gray-600 rounded-md text-xs font-semibold text-gray-300 transition-colors duration-200 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold rounded-md text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (isEditMode ? 'Saving Changes...' : 'Creating Invoice...') : (isEditMode ? 'Save & Resubmit' : 'Create Invoice')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
