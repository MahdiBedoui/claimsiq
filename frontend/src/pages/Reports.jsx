import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Loader, BarChart3, Calendar, TrendingUp } from 'lucide-react'

const REPORT_TYPES = [
  {
    id: 'daily', title: 'Daily Report', icon: Calendar, color: 'brand',
    desc: 'Claims activity KPIs, recent claims detail with conditional formatting, high-value alerts over $25K',
    includes: ['KPI metrics summary', 'Claims detail table', 'High-value claims alert sheet', 'Conditional formatting (denied/closed)']
  },
  {
    id: 'weekly', title: 'Weekly Report', icon: BarChart3, color: 'green',
    desc: 'Pivot-style analysis by claim type, status pie chart, geographic breakdown, executive summary',
    includes: ['Pivot table by claim type', 'Bar chart: claimed by type', 'Pie chart: status distribution', 'State-level analysis']
  },
  {
    id: 'monthly', title: 'Monthly Report', icon: TrendingUp, color: 'amber',
    desc: 'Monthly trend with line charts, adjuster performance metrics, data quality summary',
    includes: ['Monthly trend line chart', 'Adjuster performance table', 'Data quality summary', 'Validation issue counts']
  },
]

export default function Reports() {
  const [generating, setGenerating] = useState(null)

  const handleGenerate = async (type, format) => {
    setGenerating(`${type}-${format}`)
    const res = await fetch(`/api/reports/generate/${type}?format=${format}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_report.${format}`
    a.click()
    URL.revokeObjectURL(url)
    setGenerating(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Generator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and download claims reports in Excel or PDF format</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon
          const colorMap = {
            brand: 'border-brand-200 dark:border-brand-700/50',
            green: 'border-emerald-200 dark:border-emerald-800/50',
            amber: 'border-amber-200 dark:border-amber-800/50',
          }
          const iconBg = {
            brand: 'bg-brand-50 dark:bg-brand-800/30 text-brand-600 dark:text-cyan-400',
            green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
            amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          }

          return (
            <div key={rt.id} className={`bg-white dark:bg-brand-800/40 rounded-xl border ${colorMap[rt.color]} p-6 flex flex-col`}>
              <div className={`p-3 rounded-lg w-fit ${iconBg[rt.color]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">{rt.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{rt.desc}</p>

              <div className="mt-4 space-y-1.5">
                {rt.includes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-5 flex gap-2">
                <button onClick={() => handleGenerate(rt.id, 'xlsx')}
                  disabled={generating === `${rt.id}-xlsx`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  {generating === `${rt.id}-xlsx` ? <Loader className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  Excel
                </button>
                <button onClick={() => handleGenerate(rt.id, 'pdf')}
                  disabled={generating === `${rt.id}-pdf`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 dark:border-brand-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-brand-800/30 transition-colors disabled:opacity-50">
                  {generating === `${rt.id}-pdf` ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  PDF
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
