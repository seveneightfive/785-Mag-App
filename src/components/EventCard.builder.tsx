import { EventCard } from './EventCard'
import { Builder } from '@builder.io/react'

interface EventCardBuilderProps {
  title: string
  image: string
  venue?: string
  date: string
  time?: string
  price?: number
  slug: string
}

export function EventCardBuilder(props: EventCardBuilderProps) {
  const mockEvent = {
    title: props.title,
    image_url: props.image,
    start_date: props.date,
    event_start_time: props.time,
    ticket_price: props.price,
    slug: props.slug,
    venue: props.venue ? { name: props.venue } : null,
    event_artists: [],
  } as any

  return <EventCard event={mockEvent} />
}
