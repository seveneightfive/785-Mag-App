interface ShareData {
  title: string
  text?: string
  url: string
  imageUrl?: string
  hashtags?: string[]
}

const encodeURIParam = (str: string): string => {
  return encodeURIComponent(str)
}

export const generateFacebookShareUrl = (url: string): string => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIParam(url)}`
}

export const generateTwitterShareUrl = (data: ShareData): string => {
  const params = new URLSearchParams()
  const text = data.text || data.title
  params.append('text', text)
  params.append('url', data.url)

  if (data.hashtags && data.hashtags.length > 0) {
    params.append('hashtags', data.hashtags.join(','))
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`
}

export const generateLinkedInShareUrl = (url: string): string => {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIParam(url)}`
}

export const generateWhatsAppShareUrl = (data: ShareData): string => {
  const text = `${data.title}\n${data.url}`
  return `https://wa.me/?text=${encodeURIParam(text)}`
}

export const generateSMSShareUrl = (data: ShareData): string => {
  const text = `${data.title}\n${data.url}`
  return `sms:?body=${encodeURIParam(text)}`
}

export const generateEmailShareUrl = (data: ShareData): string => {
  const subject = data.title
  const body = `${data.text || data.title}\n\n${data.url}`

  return `mailto:?subject=${encodeURIParam(subject)}&body=${encodeURIParam(body)}`
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (err) {
        document.body.removeChild(textArea)
        return false
      }
    }
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

export const canShareFiles = (): boolean => {
  return !!(navigator.share && navigator.canShare)
}

export const shareNative = async (data: ShareData): Promise<boolean> => {
  if (!navigator.share) {
    return false
  }

  try {
    const shareData: any = {
      title: data.title,
      text: data.text || data.title,
      url: data.url
    }

    if (data.imageUrl && canShareFiles()) {
      try {
        const response = await fetch(data.imageUrl)
        const blob = await response.blob()
        const file = new File([blob], 'image.jpg', { type: blob.type })

        if (navigator.canShare({ files: [file] })) {
          shareData.files = [file]
        }
      } catch (error) {
        console.log('Could not include image in share:', error)
      }
    }

    await navigator.share(shareData)
    return true
  } catch (error: any) {
    if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
      console.error('Error sharing:', error)
    }
    return false
  }
}
