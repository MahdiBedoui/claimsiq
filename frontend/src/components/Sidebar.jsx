import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Inbox, ShieldCheck, FileSpreadsheet,
  Send, ClipboardList, Settings, Moon, Sun, ChevronLeft, ChevronRight, Activity, Home
} from 'lucide-react'

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submissions', icon: Inbox, label: 'Submissions' },
  { to: '/quality', icon: ShieldCheck, label: 'Data Quality' },
  { to: '/reports', icon: FileSpreadsheet, label: 'Reports' },
  { to: '/distribution', icon: Send, label: 'Outbox' },
  { to: '/rfp', icon: ClipboardList, label: 'RFP Tracker' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ open, setOpen, dark, setDark }) {
  return (
    <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-brand-900 border-r border-gray-200 dark:border-brand-700/50 z-30 transition-all duration-300 flex flex-col ${open ? 'w-64' : 'w-16'}`}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-brand-700/50">
        <Activity className="w-7 h-7 text-brand-600 dark:text-cyan-400 flex-shrink-0" />
        {open && (
          <span className="ml-3 text-xl font-bold text-brand-900 dark:text-white tracking-tight">
            Claims<span className="text-brand-600 dark:text-cyan-400">IQ</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-800/50 text-brand-700 dark:text-cyan-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-800/30 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {open && <span className="ml-3">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-brand-700/50 space-y-2">
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-800/30 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {open && <span className="ml-3">{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-800/30 transition-colors"
        >
          {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {open && <span className="ml-3">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
