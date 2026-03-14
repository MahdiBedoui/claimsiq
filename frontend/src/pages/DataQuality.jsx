import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ShieldCheck, AlertTriangle, XCircle, RefreshCw, Download } from 'lucide-react'
import KPICard from '../components/KPICard'

export default function DataQuality() {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState({ severity: '', rule: '' })
  const [loading, setLoading] = useState(true)
  const [revalidating, setRevalidating] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (filter.severity) params.set('severity', filter.severity)
    if (filter.rule) params.set('rule', filter.rule)
    params.set('limit', '200')
    fetch(`/api/quality?${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { load() }, [filter])

  const handleRevalidate = async () => {
    setRevalidating(true)
    await fetch('/api/quality/revalidate', { method: 'POST' })
    setRevalidating(false)
    load()
  }

  const exportCSV = () => {
    if (!data?.issues) return
    const headers = ['claim_id', 'rule_name', 'severity', 'message', 'field_name', 'field_value']
    const csv = [headers.join(','), ...data.issues.map(i => headers.map(h => `"${i[h] || ''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'validation_issues.csv'
    a.click()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>

  const { issues, summary, stats } = data
  const ruleData = summary.reduce((acc, s) => {
    const existing = acc.find(a => a.rule === s.rule_name)
    if (existing) { existing[s.severity.toLowerCase()] = s.cnt }
    else { acc.push({ rule: s.rule_name, [s.severity.toLowerCase()]: s.cnt }) }
    return acc
  }, [])

  const severityData = [
    { name: 'Errors', value: stats.errors, color: '#ef4444' },
    { name: 'Warnings', value: stats.warnings, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Quality Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Validation results and issue tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRevalidate} disabled={revalidating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${revalidating ? 'animate-spin' : ''}`} /> Revalidate
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-brand-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-brand-800/30">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Pass Rate" value={`${stats.pass_rate}%`} icon={ShieldCheck} color={stats.pass_rate > 95 ? 'green' : 'amber'} />
        <KPICard title="Total Errors" value={stats.errors} icon={XCircle} color="red" />
        <KPICard title="Total Warnings" value={stats.warnings} icon={AlertTriangle} color="amber" />
        <KPICard title="Flagged Records" value={stats.total_flagged} icon={ShieldCheck} color="brand" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Issues by Rule</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ruleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="rule" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip />
              <Bar dataKey="error" name="Errors" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
              <Bar dataKey="warning" name="Warnings" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Severity Split</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {severityData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-brand-700 rounded-lg text-sm bg-white dark:bg-brand-800 text-gray-700 dark:text-gray-300">
          <option value="">All Severities</option>
          <option value="ERROR">Errors</option>
          <option value="WARNING">Warnings</option>
        </select>
        <select value={filter.rule} onChange={e => setFilter(f => ({ ...f, rule: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-brand-700 rounded-lg text-sm bg-white dark:bg-brand-800 text-gray-700 dark:text-gray-300">
          <option value="">All Rules</option>
          {[...new Set(summary.map(s => s.rule_name))].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-brand-700/50">
              {['Claim ID', 'Rule', 'Severity', 'Message', 'Field', 'Value'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-brand-700/30">
            {issues.slice(0, 100).map((issue, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-brand-800/20">
                <td className="px-4 py-2.5 text-sm font-mono text-gray-900 dark:text-white">{issue.claim_id}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{issue.rule_name}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    issue.severity === 'ERROR' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  }`}>{issue.severity}</span>
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{issue.message}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{issue.field_name}</td>
                <td className="px-4 py-2.5 text-sm font-mono text-gray-500">{issue.field_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
