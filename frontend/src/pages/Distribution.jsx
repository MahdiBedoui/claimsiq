import { useState, useEffect } from 'react'
import { Send, Loader, CheckCircle, FileSpreadsheet, FileText, Clock } from 'lucide-react'

export default function Distribution() {
  const [log, setLog] = useState([])
  const [sending, setSending] = useState(null)
  const [toast, setToast] = useState(null)

  const load = () => fetch('/api/distribution/log').then(r => r.json()).then(setLog)
  useEffect(() => { load() }, [])

  const handleSend = async (type, format) => {
    setSending(`${type}-${format}`)
    const res = await fetch(`/api/distribution/send?report_type=${type}&format=${format}`, { method: 'POST' })
    const data = await res.json()
    setSending(null)
    setToast(`${type} report (${format.toUpperCase()}) sent to ${data.recipients.length} recipients`)
    setTimeout(() => setToast(null), 4000)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outbox & Distribution</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send reports and track distribution history</p>
      </div>

      {toast && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm text-emerald-800 dark:text-emerald-300">{toast}</span>
        </div>
      )}

      {/* Quick Send */}
      <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Send</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['daily', 'weekly', 'monthly'].map(type => (
            <div key={type} className="border border-gray-200 dark:border-brand-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">{type} Report</h3>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleSend(type, 'xlsx')} disabled={!!sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                  {sending === `${type}-xlsx` ? <Loader className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />} Send XLSX
                </button>
                <button onClick={() => handleSend(type, 'pdf')} disabled={!!sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-brand-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-brand-800/30 disabled:opacity-50">
                  {sending === `${type}-pdf` ? <Loader className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} Send PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Log */}
      <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-brand-700/50">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Distribution History</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-brand-700/50">
              {['Type', 'File', 'Size', 'Recipients', 'Status', 'Sent At'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-brand-700/30">
            {log.map((entry, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-brand-800/20">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-cyan-400 capitalize">
                    {entry.report_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{entry.file_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{entry.file_size_kb ? `${entry.file_size_kb} KB` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {Array.isArray(entry.recipients) ? entry.recipients.join(', ') : entry.recipients}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(entry.distributed_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No distributions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
