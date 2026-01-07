import React from 'react'

export type TabType = 'today' | 'tomorrow' | 'this-week'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  todayCount?: number
  tomorrowCount?: number
  thisWeekCount?: number
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  todayCount,
  tomorrowCount,
  thisWeekCount
}) => {
  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'today', label: 'TODAY', count: todayCount },
    { id: 'tomorrow', label: 'TOMORROW', count: tomorrowCount },
    { id: 'this-week', label: 'THIS WEEK', count: thisWeekCount }
  ]

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-4 px-1 font-medium text-sm tracking-wide transition-colors relative
              ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
