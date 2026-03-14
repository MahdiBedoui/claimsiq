import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, ClipboardList } from 'lucide-react'

const STATUSES = ['Received', 'In Review', 'Quoted', 'Accepted', 'Declined']
const STATUS_COLORS = {
  'Received': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  'In Review': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  'Quoted': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
  'Accepted': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  'Declined': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
}

const emptyForm = { client_name: '', broker: '', line_of_business: '', date_received: '', deadline: '', assigned_analyst: '', notes: '' }

export default function RFPTracker() {
  const [rfps, setRfps] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    const url = filterStatus ? `/api/rfp?status=${filterStatus}` : '/api/rfp'
    fetch(url).then(r => r.json()).then(setRfps)
  }
  useEffect(() => { load() }, [filterStatus])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await fetch(`/api/rfp/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: form.status, assigned_analyst: form.assigned_analyst, notes: form.notes, deadline: form.deadline })
      })
    } else {
      await fetch('/api/rfp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    }
    setForm(emptyForm)
    setShowForm(false)
    setEditId(null)
    load()
  }

  const handleEdit = (rfp) => {
    setForm({ ...rfp, status: rfp.status })
    setEditId(rfp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this RFP?')) return
    await fetch(`/api/rfp/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RFP Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track incoming Requests for Proposal</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
          <Plus className="w-4 h-4" /> New RFP
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterStatus ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-brand-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-brand-700'}`}>
          All
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-brand-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-brand-700'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* RFP Cards */}
      {rfps.length === 0 ? (
        <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-10 text-center">
          <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-400">No RFPs found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rfps.map(rfp => (
            <div key={rfp.id} className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{rfp.client_name}</h3>
                  {rfp.broker && <p className="text-xs text-gray-500 mt-0.5">Broker: {rfp.broker}</p>}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rfp.status] || 'bg-gray-100 text-gray-600'}`}>
                  {rfp.status}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                {rfp.line_of_business && <p>Line: {rfp.line_of_business}</p>}
                <p>Received: {rfp.date_received}</p>
                {rfp.deadline && <p>Deadline: {rfp.deadline}</p>}
                {rfp.assigned_analyst && <p>Analyst: {rfp.assigned_analyst}</p>}
                {rfp.notes && <p className="text-gray-400 italic">{rfp.notes}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleEdit(rfp)} className="flex items-center gap-1 text-xs text-brand-600 dark:text-cyan-400 hover:underline">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(rfp.id)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-brand-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editId ? 'Edit RFP' : 'New RFP'}</h3>
            {[
              { key: 'client_name', label: 'Client Name', required: true },
              { key: 'broker', label: 'Broker' },
              { key: 'line_of_business', label: 'Line of Business' },
              { key: 'date_received', label: 'Date Received', type: 'date', required: true },
              { key: 'deadline', label: 'Deadline', type: 'date' },
              { key: 'assigned_analyst', label: 'Assigned Analyst' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
                <input type={f.type || 'text'} required={f.required} value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-brand-700 rounded-lg text-sm bg-white dark:bg-brand-900 text-gray-900 dark:text-white" />
              </div>
            ))}
            {editId && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                <select value={form.status || ''} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-brand-700 rounded-lg text-sm bg-white dark:bg-brand-900 text-gray-900 dark:text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-700 rounded-lg text-sm bg-white dark:bg-brand-900 text-gray-900 dark:text-white" rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
                {editId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-brand-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-brand-800/30">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
