import { NavLink, useNavigate } from 'react-router-dom'
import { FileText, Home, Info, Briefcase, DollarSign, Lightbulb, Mail, Settings, Plus, Inbox, Users, Image } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const pages = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/about', label: 'About Us', icon: Info },
  { path: '/work', label: 'Our Work', icon: Briefcase },
  { path: '/pricing', label: 'Pricing', icon: DollarSign },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/contact', label: 'Contact Us', icon: Mail },
]

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="px-4 pt-5 pb-1 text-xs font-semibold tracking-widest uppercase"
      style={{ color: 'rgba(255,255,255,0.4)' }}
    >
      {children}
    </div>
  )
}

function NavItem({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: React.ComponentType<{ size?: number }>
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative"
      style={({ isActive }) => ({
        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--ci-yellow)' : '3px solid transparent',
      })}
    >
      <Icon size={15} />
      <span>{children}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col overflow-y-auto sidebar-scroll"
      style={{
        background: 'var(--ci-navy-deep)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        height: 'calc(100vh - 48px)',
      }}
    >
      <SectionLabel>Pages</SectionLabel>
      <nav className="flex flex-col">
        {pages.map(p => (
          <NavItem key={p.path} to={p.path} icon={p.icon}>
            {p.label}
          </NavItem>
        ))}
      </nav>

      <div className="my-2 mx-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      <SectionLabel>Articles</SectionLabel>
      <div className="px-4 py-1">
        <button
          onClick={() => navigate('/articles/new')}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors w-full"
          style={{ color: 'var(--ci-yellow)', border: '1px solid rgba(244,191,0,0.4)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,191,0,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus size={13} />
          New Article
        </button>
      </div>
      <nav className="flex flex-col">
        <NavItem to="/articles" icon={FileText}>
          All Articles
        </NavItem>
      </nav>

      <div className="my-2 mx-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      <SectionLabel>Other</SectionLabel>
      <nav className="flex flex-col">
        <NavItem to="/submissions" icon={Inbox}>
          Submissions
        </NavItem>
        <NavItem to="/media" icon={Image}>
          Media Library
        </NavItem>
        <NavItem to="/settings" icon={Settings}>
          Site Settings
        </NavItem>
        {isAdmin && (
          <NavItem to="/team" icon={Users}>
            Team
          </NavItem>
        )}
      </nav>
    </aside>
  )
}
