interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export default function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-0 px-8"
      style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative px-4 py-3 text-sm font-medium transition-colors"
            style={{
              color: isActive ? '#111111' : '#6b6b6b',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: '#f4bf00' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
