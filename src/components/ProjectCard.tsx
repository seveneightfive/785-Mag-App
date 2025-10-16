import React from 'react'
import { MoreVertical } from 'lucide-react'

interface ProjectCardProps {
  title: string
  subtitle: string
  taskCount: number
  percentage: number
  color: 'purple' | 'teal' | 'coral'
  images?: string[]
  onClick?: () => void
}

const colorClasses = {
  purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
  teal: 'bg-gradient-to-br from-teal-400 to-teal-600',
  coral: 'bg-gradient-to-br from-orange-400 to-orange-600'
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  subtitle,
  taskCount,
  percentage,
  color,
  images = [],
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`${colorClasses[color]} rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex -space-x-2">
          {images.slice(0, 3).map((img, idx) => (
            <div
              key={idx}
              className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center overflow-hidden"
            >
              {img ? (
                <img src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/30" />
              )}
            </div>
          ))}
          {images.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs font-medium">
              +{images.length - 3}
            </div>
          )}
        </div>
        <button className="p-1 hover:bg-white/10 rounded transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-white/90 mb-4">{subtitle}</p>

      <div className="flex items-center justify-between text-sm mb-2">
        <span>{taskCount} {taskCount === 1 ? 'item' : 'items'}</span>
        <span>{percentage}%</span>
      </div>

      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
        <div
          className="bg-white h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
