import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle, Loader, Eye, Download } from 'lucide-react'

export default function Submissions() {
  const [subs, setSubs] = useState([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [result, setResult] = useState(null)

  const [loadingSample, setLoadingSample] = useState(false)

  const load = () => fetch('/api/submissions').then(r => r.json()).then(setSubs)
  useEffect(() => { load() }, [])

  const handleLoadSample = async () => {
    setLoadingSample(true)
    const res = await fetch('/api/sample-csv')
    const blob = await res.blob()
    const file = new File([blob], 'sample_claims.csv', { type: 'text/csv' })
    await handleUpload(file)
    setLoadingSample(false)
  }

  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith('.csv')) return alert('Please upload a CSV file')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/submissions/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    load()
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleUpload(file)
  }, [])

  const handleProcess = async (id) => {
    setProcessing(id)
    const res = await fetch(`/api/submissions/${id}/process`, { method: 'POST' })
    const data = await res.json()
    setResult(data)
    setProcessing(null)
    load()
  }

  const handlePreview = async (id) => {
    const res = await fetch(`/api/submissions/${id}/preview`)
    const data = await res.json()
    setPreview(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submissions Inbox</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload and process claim submissions</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/30'
            : 'border-gray-300 dark:border-brand-700/50 hover:border-brand-400'
        }`}
      >
        {uploading ? (
          <Loader className="w-10 h-10 mx-auto text-brand-500 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500" />
        )}
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {uploading ? 'Uploading...' : 'Drag & drop a CSV file here, or'}
        </p>
        {!uploading && (
          <div className="flex items-center justify-center gap-3 mt-2">
            <label className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
            </label>
            <span className="text-xs text-gray-400">or</span>
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loadingSample ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Try Sample CSV
            </button>
          </div>
        )}
      </div>

      {/* Result notification */}
      {result && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Processed {result.loaded} records — Pass rate: {result.validation.pass_rate}% ({result.validation.errors} errors, {result.validation.warnings} warnings)
            </span>
          </div>
          <button onClick={() => setResult(null)} className="text-xs text-emerald-600 mt-1 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Submissions table */}
      <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-brand-700/50">
              {['File', 'Source', 'Records', 'Status', 'Errors', 'Warnings', 'Uploaded', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-brand-700/30">
            {subs.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-brand-800/20">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> {s.file_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.source}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.record_count || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === 'Processed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                    s.status === 'Error' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-red-500">{s.errors || '—'}</td>
                <td className="px-4 py-3 text-sm text-amber-500">{s.warnings || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(s.uploaded_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handlePreview(s.id)} className="text-xs text-brand-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                  {s.status === 'New' && (
                    <button onClick={() => handleProcess(s.id)} disabled={processing === s.id}
                      className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                      {processing === s.id ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Process
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No submissions yet. Upload a CSV to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white dark:bg-brand-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Preview (first 20 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>{preview.columns.map(c => <th key={c} className="px-2 py-1 text-left font-medium text-gray-500 border-b">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-brand-700/30">
                      {preview.columns.map(c => <td key={c} className="px-2 py-1 text-gray-700 dark:text-gray-300">{row[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setPreview(null)} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
