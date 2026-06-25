import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const SETTINGS_API = 'http://localhost:5000/api/auth/settings'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [businessName, setBusinessName] = useState(user?.businessName || '')
  const [currency, setCurrency] = useState(user?.currency || 'USD')
  const [address, setAddress] = useState(user?.address || '')
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '')
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await axios.put(SETTINGS_API, {
        name,
        businessName,
        currency,
        address,
        gstNumber
      })
      updateUser(res.data.user)
      setMessage('Settings updated successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err.response?.data?.error || 'Failed to update settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Link to="/" className="text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors duration-200">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-gray-500 text-sm font-normal">Configure your default business info and currency preferences.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-sm text-emerald-400 font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#111111] border border-[#ffffff08] rounded-lg p-8 space-y-6 shadow-xl">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block" htmlFor="settingsName">
              Full Name *
            </label>
            <input
              id="settingsName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white font-normal outline-none transition-colors duration-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block" htmlFor="settingsCurrency">
              Preferred Currency *
            </label>
            <select
              id="settingsCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white font-normal outline-none transition-colors duration-200 cursor-pointer"
              required
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
            <p className="text-[11px] text-gray-500 font-normal">This acts as your fallback and default business currency.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 block" htmlFor="settingsBusinessName">
            Business / Brand Name
          </label>
          <input
            id="settingsBusinessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white font-normal outline-none transition-colors duration-200"
            placeholder="e.g. Acme Consultancy"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 block" htmlFor="settingsGstNumber">
            GST / VAT Registration Number
          </label>
          <input
            id="settingsGstNumber"
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white font-normal outline-none transition-colors duration-200"
            placeholder="e.g. 22AAAAA0000A1Z5"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 block" htmlFor="settingsAddress">
            Business Address
          </label>
          <textarea
            id="settingsAddress"
            rows="3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#ffffff08] focus:border-[#10B981] rounded-md px-3.5 py-2.5 text-sm text-white font-normal outline-none transition-colors duration-200 resize-y"
            placeholder="Street address, city, zip code..."
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-[#ffffff08]">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold rounded-md text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
