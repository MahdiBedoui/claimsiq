import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Submissions from './pages/Submissions'
import DataQuality from './pages/DataQuality'
import Reports from './pages/Reports'
import Distribution from './pages/Distribution'
import RFPTracker from './pages/RFPTracker'
import Settings from './pages/Settings'

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} dark={dark} setDark={setDark} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/quality" element={<DataQuality />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/distribution" element={<Distribution />} />
            <Route path="/rfp" element={<RFPTracker />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
