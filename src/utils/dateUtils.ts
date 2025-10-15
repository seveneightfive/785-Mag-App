export const getToday = (): Date => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export const getTomorrow = (): Date => {
  const today = getToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export const getDayAfterTomorrow = (): Date => {
  const today = getToday()
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 2)
  return dayAfter
}

export const getSevenDaysFromNow = (): Date => {
  const today = getToday()
  const sevenDays = new Date(today)
  sevenDays.setDate(sevenDays.getDate() + 7)
  return sevenDays
}

export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export const formatEventTime = (timeString?: string): string => {
  if (!timeString) return ''
  return timeString
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString)
  const today = getToday()
  return isSameDay(date, today)
}

export const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString)
  const tomorrow = getTomorrow()
  return isSameDay(date, tomorrow)
}

export const isThisWeek = (dateString: string): boolean => {
  const date = new Date(dateString)
  const today = getToday()
  const sevenDays = getSevenDaysFromNow()

  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return eventDate >= today && eventDate < sevenDays
}
