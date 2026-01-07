import React, { useState, useEffect, useRef } from 'react'
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Mail,
  Copy,
  Share2,
  X
} from 'lucide-react'
import {
  generateFacebookShareUrl,
  generateTwitterShareUrl,
  generateLinkedInShareUrl,
  generateWhatsAppShareUrl,
  generateSMSShareUrl,
  generateEmailShareUrl,
  copyToClipboard,
  shareNative,
  canShareFiles
} from '../utils/shareUtils'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  url: string
  imageUrl?: string
  hashtags?: string[]
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  url,
  imageUrl,
  hashtags = ['785mag']
}) => {
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const shareData = {
    title,
    text: description,
    url,
    imageUrl,
    hashtags
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    const success = await shareNative(shareData)
    if (success) {
      onClose()
    }
  }

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => handleShare(generateFacebookShareUrl(url))
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      action: () => handleShare(generateTwitterShareUrl(shareData))
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => handleShare(generateLinkedInShareUrl(url))
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: () => handleShare(generateWhatsAppShareUrl(shareData))
    },
    {
      name: 'Text',
      icon: MessageCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      action: () => window.location.href = generateSMSShareUrl(shareData)
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      action: () => window.location.href = generateEmailShareUrl(shareData)
    }
  ]

  if (navigator.share) {
    shareOptions.unshift({
      name: 'Share',
      icon: Share2,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      action: handleNativeShare
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Share</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className={`flex flex-col items-center justify-center p-4 rounded-xl ${option.bgColor} transition-colors`}
              >
                <option.icon className={`${option.color} mb-2`} size={28} />
                <span className="text-sm font-medium text-gray-700">
                  {option.name}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-2">Or copy link</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                }`}
              >
                <Copy size={16} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
