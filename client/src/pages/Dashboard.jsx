import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useAuth } from '../context/AuthContext'

const STATS_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/dashboard/stats'

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

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const currencySymbol = getCurrencySymbol(user?.currency || 'USD')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(STATS_API)
        setStats(res.data)
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err)
        setError('Failed to load dashboard metrics. Make sure the server and database are running.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-medium">Assembling dashboard analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 text-center font-medium">
          {error}
        </div>
      </div>
    )
  }

  const { summary, pieData, monthlyRevenue, topClients, recentInvoices } = stats

  // Custom tooltip styles for Recharts
  const customTooltipStyle = {
    contentStyle: {
      backgroundColor: '#111111',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '6px',
      color: '#FFFFFF'
    },
    labelStyle: {
      color: '#9CA3AF',
      fontWeight: 'bold',
      marginBottom: '4px'
    }
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Dashboard Top Header & Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ffffff08] pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm font-normal">
            Workspace: <span className="text-gray-300 font-medium">{user?.businessName || 'My Business'}</span> &middot; Base currency: {user?.currency} ({currencySymbol.trim()})
          </p>
        </div>
        
        {/* Quick action triggers */}
        <div className="flex items-center gap-3">
          <Link
            to="/clients"
            className="px-4 py-2 border border-gray-800 hover:border-gray-600 rounded-md text-xs font-semibold text-gray-300 transition-colors duration-200"
          >
            Add Client
          </Link>
          <Link
            to="/expenses"
            className="px-4 py-2 border border-gray-800 hover:border-gray-600 rounded-md text-xs font-semibold text-gray-300 transition-colors duration-200"
          >
            Log Expense
          </Link>
          <Link
            to="/invoices/create"
            className="px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] font-semibold rounded-md text-xs transition-colors duration-200"
          >
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Earned */}
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-5 flex flex-col justify-between shadow-lg hover:border-gray-800 transition-all duration-200 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Earned</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">
              {currencySymbol}{summary.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500">From paid client billings</p>
          </div>
        </div>

        {/* Card 2: Pending Amount */}
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-5 flex flex-col justify-between shadow-lg hover:border-gray-800 transition-all duration-200 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending</span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">
              {currencySymbol}{summary.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500">Awaiting client transfers</p>
          </div>
        </div>

        {/* Card 3: Overdue Amount */}
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-5 flex flex-col justify-between shadow-lg hover:border-gray-800 transition-all duration-200 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overdue</span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">
              {currencySymbol}{summary.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-red-400/80 font-medium">Requires immediate follow-up</p>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-[#111111] border border-[#ffffff08] rounded-lg p-5 flex flex-col justify-between shadow-lg hover:border-gray-800 transition-all duration-200 min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Profit</span>
            <span className="text-lg">📈</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold text-[#10B981] tracking-tight">
              {currencySymbol}{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500">Margin calculated after expenses</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-8 bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-5 shadow-lg">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-white text-base">Monthly Revenue</h3>
            <p className="text-gray-500 text-xs font-normal">Income performance over the last 6 months.</p>
          </div>
          <div className="h-[280px] w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 10, right: 0, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.015)' }}
                  contentStyle={customTooltipStyle.contentStyle}
                  labelStyle={customTooltipStyle.labelStyle}
                  formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-white text-base">Invoices Distribution</h3>
            <p className="text-gray-500 text-xs font-normal">Status breakdown based on count.</p>
          </div>
          <div className="h-[200px] w-full relative flex items-center justify-center grow my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={customTooltipStyle.contentStyle}
                  formatter={(value, name, props) => [
                    `${value} Invoices (${currencySymbol}${props.payload.amount.toLocaleString()})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Sum */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Total</span>
              <span className="text-2xl font-bold text-white leading-none">
                {pieData.reduce((sum, entry) => sum + entry.value, 0)}
              </span>
            </div>
          </div>
          {/* Custom legends */}
          <div className="flex justify-around items-center pt-2 text-[11px] font-semibold border-t border-[#ffffff04]">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-400">{item.name}: <span className="text-white">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Invoices Table (2/3 columns) */}
        <div className="lg:col-span-8 bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-white text-base">Recent Invoices</h3>
              <p className="text-gray-500 text-xs font-normal">Review status of your latest client invoices.</p>
            </div>
            <Link to="/invoices" className="text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors duration-200">
              View All &rarr;
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-500">
              No invoices created yet. Click 'Create Invoice' to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-gray-400">
                <thead>
                  <tr className="border-b border-[#ffffff08] text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3">Invoice No.</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ffffff04]">
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-[#ffffff02] transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-3 text-white font-semibold">{inv.invoiceNumber}</td>
                      <td className="py-3">
                        <div>
                          <span className="text-gray-300 block">{inv.clientName}</span>
                          {inv.companyName && <span className="text-gray-600 text-[10px]">{inv.companyName}</span>}
                        </div>
                      </td>
                      <td className="py-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : inv.status === 'overdue'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-white font-semibold">
                        {currencySymbol}{inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Clients by Revenue (1/3 column) */}
        <div className="lg:col-span-4 bg-[#111111] border border-[#ffffff08] rounded-lg p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-white text-base">Top Clients</h3>
            <p className="text-gray-500 text-xs font-normal">Ranked by total earned revenue.</p>
          </div>

          <div className="grow flex flex-col justify-center">
            {topClients.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500">
                No paid revenue statistics to display.
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {topClients.map((client, idx) => {
                  const maxRevenue = topClients[0]?.revenue || 1
                  const percent = Math.min(100, Math.max(5, (client.revenue / maxRevenue) * 100))

                  return (
                    <div key={client.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-emerald-500/10 text-[10px] text-[#10B981] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-white block font-semibold">{client.name}</span>
                            <span className="text-gray-500 text-[10px] font-normal">{client.company}</span>
                          </div>
                        </div>
                        <span className="text-[#10B981] font-bold">
                          {currencySymbol}{client.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full overflow-hidden border border-[#ffffff04]">
                        <div
                          className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer insight */}
          <div className="pt-3 border-t border-[#ffffff04] text-[10px] text-gray-500 text-center font-normal leading-relaxed">
            Revenue aggregates exclusive of active unpaid or overdue invoices.
          </div>
        </div>
      </div>
    </div>
  )
}
