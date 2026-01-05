import React from 'react'
import { Event, Advertisement } from '../lib/supabase'
import { SponsoredEventCard } from '../components/SponsoredEventCard'

interface InjectedItem {
  type: 'event' | 'ad'
  data: Event | Advertisement
  position: number
}

export const injectAds = (
  events: Event[],
  ads: Advertisement[],
  pageType: string = 'events-directory'
): InjectedItem[] => {
  if (!ads || ads.length === 0) {
    return events.map((event, index) => ({
      type: 'event',
      data: event,
      position: index
    }))
  }

  const result: InjectedItem[] = []
  let adIndex = 0
  const usedAdIds = new Set<string>()

  for (let i = 0; i < events.length; i++) {
    result.push({
      type: 'event',
      data: events[i],
      position: i
    })

    const nextPosition = i + 1
    if (nextPosition % 10 === 0 && nextPosition < events.length) {
      if (adIndex < ads.length && !usedAdIds.has(ads[adIndex].id)) {
        result.push({
          type: 'ad',
          data: ads[adIndex],
          position: nextPosition
        })
        usedAdIds.add(ads[adIndex].id)
        adIndex = (adIndex + 1) % ads.length
      }
    }
  }

  return result
}

export const renderInjectedItems = (
  items: InjectedItem[],
  EventComponent: React.ComponentType<any>,
  eventProps: any = {},
  pageType: string = 'events-directory'
) => {
  return items.map((item, index) => {
    if (item.type === 'ad') {
      return (
        <SponsoredEventCard
          key={`ad-${item.data.id}-${index}`}
          ad={item.data as Advertisement}
          position={item.position}
          pageType={pageType}
        />
      )
    } else {
      return (
        <EventComponent
          key={`event-${item.data.id}-${index}`}
          event={item.data as Event}
          {...eventProps}
        />
      )
    }
  })
}
