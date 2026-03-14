import { useState, useEffect } from 'react'
import { Mail, ShieldCheck, RefreshCw, Loader } from 'lucide-react'

export default function Settings() {
  const [recipients, setRecipients] = useState({})
  const [rules, setRules] = useState({})
  const [seeding, setSeeding] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetch('/api/settings/recipients').then(r => r.json()).then(setRecipients)
    fetch('/api/settings/rules').then(r => r.json()).then(setRules)
  }, [])

  const handleReseed = async () => {
    setSeeding(true)
    const res = await fetch('/api/seed', { method: 'POST' })
    const data = await res.json()
    setSeeding(false)
    setToast(`Reseeded: ${data.loaded} records loaded, pass rate ${data.validation.pass_rate}%`)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pipeline configuration and preferences</p>
      </div>

      {toast && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-300">{toast}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipients */}
        <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-brand-600 dark:text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Recipients</h2>
          </div>
          {Object.entries(recipients).map(([type, emails]) => (
            <div key={type} className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">{type} Reports</p>
              <div className="space-y-1">
                {emails.map((email, i) => (
                  <div key={i} className="px-3 py-2 bg-gray-50 dark:bg-brand-900/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {email}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Validation Rules */}
        <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Validation Rules</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Min Claim Amount</span>
              <span className="font-mono text-gray-900 dark:text-white">${rules.claim_amount_min?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Max Claim Amount</span>
              <span className="font-mono text-gray-900 dark:text-white">${rules.claim_amount_max?.toLocaleString()}</span>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-1.5">Allowed Statuses</p>
              <div className="flex flex-wrap gap-1.5">
                {rules.allowed_statuses?.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-brand-50 dark:bg-brand-800 rounded text-xs text-brand-700 dark:text-cyan-400">{s}</span>
                ))}
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-1.5">Allowed Claim Types</p>
              <div className="flex flex-wrap gap-1.5">
                {rules.allowed_claim_types?.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-brand-50 dark:bg-brand-800 rounded text-xs text-brand-700 dark:text-cyan-400">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-1.5">Required Fields</p>
              <div className="flex flex-wrap gap-1.5">
                {rules.required_fields?.map(f => (
                  <span key={f} className="px-2 py-0.5 bg-gray-100 dark:bg-brand-900/50 rounded text-xs font-mono text-gray-600 dark:text-gray-400">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reseed */}
      <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Data Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Regenerate synthetic claims data and rerun validation. This replaces all existing data.</p>
        <button onClick={handleReseed} disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          {seeding ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Reseed Data
        </button>
      </div>
    </div>
  )
}
