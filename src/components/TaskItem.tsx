import React from 'react'
import { Circle, CheckCircle2 } from 'lucide-react'

interface TaskItemProps {
  title: string
  subtitle: string
  color: 'purple' | 'teal' | 'coral'
  completed?: boolean
  onClick?: () => void
}

const colorClasses = {
  purple: 'border-purple-500',
  teal: 'border-teal-500',
  coral: 'border-orange-500'
}

export const TaskItem: React.FC<TaskItemProps> = ({
  title,
  subtitle,
  color,
  completed = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-start space-x-3 p-4 bg-white rounded-xl border-l-4 ${colorClasses[color]} hover:shadow-md transition-all duration-200 cursor-pointer group`}
    >
      <button className="mt-0.5 text-gray-400 group-hover:text-gray-600 transition-colors">
        {completed ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold text-gray-900 ${completed ? 'line-through' : ''}`}>
          {title}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}
