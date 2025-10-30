import ReactGA from 'react-ga4'

const MEASUREMENT_ID = 'G-Z39GB74Y57'

let isInitialized = false

export const initGA = () => {
  if (!isInitialized && typeof window !== 'undefined') {
    ReactGA.initialize(MEASUREMENT_ID, {
      gtagOptions: {
        send_page_view: false
      }
    })
    isInitialized = true
  }
}

export const trackPageView = (path: string) => {
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: path })
  }
}

export const trackAdImpression = (params: {
  ad_id: string
  ad_title: string
  position: number
  page_type: string
}) => {
  if (isInitialized) {
    ReactGA.event('ad_impression', {
      ad_id: params.ad_id,
      ad_title: params.ad_title,
      placement_position: params.position,
      page_type: params.page_type
    })
  }
}

export const trackAdClick = (params: {
  ad_id: string
  ad_title: string
  position: number
  page_type: string
  destination_url: string
}) => {
  if (isInitialized) {
    ReactGA.event('ad_click', {
      ad_id: params.ad_id,
      ad_title: params.ad_title,
      placement_position: params.position,
      page_type: params.page_type,
      destination_url: params.destination_url
    })
  }
}

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (isInitialized) {
    ReactGA.event({
      category,
      action,
      label,
      value
    })
  }
}

export const setUserId = (userId: string | null) => {
  if (isInitialized && userId) {
    ReactGA.set({ userId })
  }
}
