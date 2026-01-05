import { Event } from '../lib/supabase'

interface CalendarEventData {
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  url?: string
}

const formatICSDate = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

const parseEventTime = (dateStr: string, timeStr?: string): Date => {
  const date = new Date(dateStr)

  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    date.setHours(hours, minutes, 0, 0)
  } else {
    date.setHours(19, 0, 0, 0)
  }

  return date
}

const calculateEndTime = (startTime: Date, endTimeStr?: string): Date => {
  if (endTimeStr) {
    const endDate = new Date(startTime)
    const [hours, minutes] = endTimeStr.split(':').map(Number)
    endDate.setHours(hours, minutes, 0, 0)
    return endDate
  }

  const endDate = new Date(startTime)
  endDate.setHours(startTime.getHours() + 2, startTime.getMinutes(), 0, 0)
  return endDate
}

const prepareCalendarData = (event: Event): CalendarEventData => {
  const startTime = parseEventTime(event.start_date, event.event_start_time)
  const endTime = calculateEndTime(startTime, event.event_end_time)

  let location = ''
  if (event.venue) {
    location = event.venue.name
    if (event.venue.address) {
      location += `, ${event.venue.address}`
    }
    if (event.venue.city && event.venue.city !== 'Topeka') {
      location += `, ${event.venue.city}`
    }
    if (event.venue.state) {
      location += `, ${event.venue.state}`
    }
  }

  let description = event.description || ''

  if (event.event_artists && event.event_artists.length > 0) {
    const artistNames = event.event_artists.map(ea => ea.artist.name).join(', ')
    description += `\n\nFeaturing: ${artistNames}`
  }

  if (event.ticket_price) {
    description += `\n\nPrice: $${event.ticket_price}`
  }

  if (event.ticket_url) {
    description += `\n\nGet Tickets: ${event.ticket_url}`
  }

  description += `\n\nMore info: ${window.location.origin}/events/${event.slug}`

  return {
    title: event.title,
    description: description.trim(),
    location,
    startTime,
    endTime,
    url: `${window.location.origin}/events/${event.slug}`
  }
}

export const generateICS = (event: Event): string => {
  const calData = prepareCalendarData(event)

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//seveneightfive magazine//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(calData.startTime)}`,
    `DTEND:${formatICSDate(calData.endTime)}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `UID:${event.id}@785mag.com`,
    `SUMMARY:${calData.title.replace(/\n/g, '\\n')}`,
    `DESCRIPTION:${calData.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${calData.location.replace(/\n/g, '\\n')}`,
    `URL:${calData.url}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return icsContent
}

export const downloadICS = (event: Event): void => {
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.slug || 'event'}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateGoogleCalendarUrl = (event: Event): string => {
  const calData = prepareCalendarData(event)

  const formatGoogleDate = (date: Date): string => {
    return formatICSDate(date).replace(/[-:]/g, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: calData.title,
    details: calData.description,
    location: calData.location,
    dates: `${formatGoogleDate(calData.startTime)}/${formatGoogleDate(calData.endTime)}`
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
