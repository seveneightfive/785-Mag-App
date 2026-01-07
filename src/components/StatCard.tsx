import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  value: number
  label: string
  color?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  color = 'text-gray-900'
}) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">
        <Icon size={24} className={color} />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  )
}
