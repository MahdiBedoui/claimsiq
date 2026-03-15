import { useNavigate } from 'react-router-dom'
import {
  Activity, Inbox, ShieldCheck, FileSpreadsheet, Send, ClipboardList,
  ArrowRight, Upload, CheckCircle, BarChart3, FileDown, Mail, Lightbulb
} from 'lucide-react'

const workflowSteps = [
  {
    step: 1,
    title: 'Upload Claims Data',
    description: 'Navigate to the Submissions page and upload your claims data as a CSV file. You can drag and drop or browse to select your file. Preview the first 20 rows to confirm the data looks correct before processing.',
    icon: Upload,
    link: '/submissions',
    linkLabel: 'Go to Submissions',
    color: 'brand',
  },
  {
    step: 2,
    title: 'Process & Validate',
    description: 'Once uploaded, click "Process" to run the data through our 8-rule validation engine. The system checks for required fields, valid amounts, duplicate claims, date logic, and more — flagging errors and warnings automatically.',
    icon: ShieldCheck,
    link: '/quality',
    linkLabel: 'View Data Quality',
    color: 'emerald',
  },
  {
    step: 3,
    title: 'Review Quality Issues',
    description: 'Head to the Data Quality Center to inspect any validation issues. Filter by severity (Error or Warning) or by specific rule. Fix issues in your source data and re-upload, or click "Revalidate" to rerun checks on existing records.',
    icon: CheckCircle,
    link: '/quality',
    linkLabel: 'Data Quality Center',
    color: 'amber',
  },
  {
    step: 4,
    title: 'Monitor Your Dashboard',
    description: 'The Dashboard gives you a real-time overview of your claims portfolio — total claims count, total amounts, validation pass rate, and average processing days. Interactive charts show trends by month, status, type, and geography.',
    icon: BarChart3,
    link: '/dashboard',
    linkLabel: 'Open Dashboard',
    color: 'brand',
  },
  {
    step: 5,
    title: 'Generate Reports',
    description: 'Use the Report Generator to create Daily, Weekly, or Monthly reports in Excel (XLSX) or PDF format. Reports include KPI summaries, pivot tables, conditional formatting, and charts — ready for stakeholders.',
    icon: FileDown,
    link: '/reports',
    linkLabel: 'Generate Reports',
    color: 'violet',
  },
  {
    step: 6,
    title: 'Distribute to Stakeholders',
    description: 'Send generated reports to pre-configured recipient lists through the Outbox. Every distribution is logged with a full audit trail showing who received what, when, and the delivery status.',
    icon: Mail,
    link: '/distribution',
    linkLabel: 'Open Outbox',
    color: 'cyan',
  },
]

const features = [
  {
    title: 'Submissions Inbox',
    description: 'Drag-and-drop CSV upload with instant preview and processing history.',
    icon: Inbox,
    link: '/submissions',
  },
  {
    title: 'Data Quality Center',
    description: '8-rule validation engine with severity levels, filtering, and one-click revalidation.',
    icon: ShieldCheck,
    link: '/quality',
  },
  {
    title: 'Report Generator',
    description: 'Create polished Daily, Weekly, or Monthly reports in Excel or PDF format.',
    icon: FileSpreadsheet,
    link: '/reports',
  },
  {
    title: 'Outbox & Distribution',
    description: 'Send reports to stakeholders with complete audit trail tracking.',
    icon: Send,
    link: '/distribution',
  },
  {
    title: 'RFP Tracker',
    description: 'Manage Requests for Proposal from intake to resolution with status tracking.',
    icon: ClipboardList,
    link: '/rfp',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Real-time KPIs, trend charts, and geographic breakdowns of your portfolio.',
    icon: BarChart3,
    link: '/dashboard',
  },
]

const stepColorMap = {
  brand: {
    badge: 'bg-brand-100 text-brand-700 dark:bg-brand-800/60 dark:text-brand-300',
    icon: 'text-brand-600 dark:text-brand-400',
    line: 'bg-brand-200 dark:bg-brand-700/50',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
    line: 'bg-emerald-200 dark:bg-emerald-800/50',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    line: 'bg-amber-200 dark:bg-amber-800/50',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    icon: 'text-violet-600 dark:text-violet-400',
    line: 'bg-violet-200 dark:bg-violet-800/50',
  },
  cyan: {
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
    icon: 'text-cyan-600 dark:text-cyan-400',
    line: 'bg-cyan-200 dark:bg-cyan-800/50',
  },
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-600 dark:from-brand-800 dark:via-brand-700 dark:to-cyan-800 p-8 md:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Welcome to Claims<span className="text-cyan-200">IQ</span>
            </h1>
          </div>
          <p className="text-lg text-white/90 leading-relaxed mb-6 max-w-2xl">
            ClaimsIQ is your end-to-end platform for insurance claims reporting and analytics.
            Upload claims data, validate it automatically, generate professional reports, and
            distribute them to stakeholders — all from one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/submissions')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-semibold rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tip */}
      <div className="flex items-start gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-5">
        <Lightbulb className="w-6 h-6 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">First time here?</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
            Follow the step-by-step workflow below to learn how ClaimsIQ works. Each step links
            directly to the relevant page so you can jump in right away. The system comes pre-loaded
            with sample data, and the Submissions page has a ready-to-use sample CSV so you can test the full workflow immediately.
          </p>
        </div>
      </div>

      {/* Workflow Steps */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">How It Works</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Follow these steps to go from raw claims data to polished stakeholder reports.</p>

        <div className="space-y-6">
          {workflowSteps.map((item, idx) => {
            const Icon = item.icon
            const colors = stepColorMap[item.color] || stepColorMap.brand
            const isLast = idx === workflowSteps.length - 1

            return (
              <div key={item.step} className="flex gap-5">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${colors.badge}`}>
                    {item.step}
                  </div>
                  {!isLast && <div className={`w-0.5 flex-1 mt-2 ${colors.line}`} />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-5">
                    <div className="flex items-start gap-3 mb-2">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-8 mb-3">
                      {item.description}
                    </p>
                    <button
                      onClick={() => navigate(item.link)}
                      className="ml-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 transition-colors"
                    >
                      {item.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature Grid */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Platform Features</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Everything you need to manage your claims reporting pipeline.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ title, description, icon: Icon, link }) => (
            <button
              key={title}
              onClick={() => navigate(link)}
              className="group text-left bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-5 hover:border-brand-300 dark:hover:border-brand-600/60 hover:shadow-md transition-all"
            >
              <Icon className="w-8 h-8 text-brand-500 dark:text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <div className="text-center bg-white dark:bg-brand-800/40 rounded-xl border border-gray-200 dark:border-brand-700/50 p-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ready to get started?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-md mx-auto">
          Upload your first claims file or explore the dashboard with pre-loaded sample data.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/submissions')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            Upload Claims <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-brand-700/50 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-brand-700 transition-colors"
          >
            Explore Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
