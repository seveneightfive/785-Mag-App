import { Builder } from '@builder.io/react'
import { EventCardBuilder } from './components/EventCard.builder'

Builder.registerComponent(EventCardBuilder, {
  name: 'Event Card',
  inputs: [
    { name: 'title', type: 'string', required: true },
    { name: 'image', type: 'file', allowedFileTypes: ['jpeg', 'png', 'webp'] },
    { name: 'venue', type: 'string' },
    { name: 'date', type: 'string' },
    { name: 'time', type: 'string' },
    { name: 'price', type: 'number' },
    { name: 'slug', type: 'string', helperText: 'Used for event link' }
  ]
})
