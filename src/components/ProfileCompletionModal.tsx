import React, { useState } from 'react'
import { User, Mail, Phone, Loader, CheckCircle } from 'lucide-react'

interface ProfileCompletionModalProps {
  isOpen: boolean
  authMethod: 'email' | 'phone'
  currentEmail?: string
  currentPhone?: string
  onComplete: (data: { full_name: string; phone_number?: string; email?: string }) => Promise<void>
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  authMethod,
  currentEmail,
  currentPhone,
  onComplete,
}) => {
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateFullName = (value: string): boolean => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, full_name: 'Full name is required' }))
      return false
    }
    if (value.trim().length < 2) {
      setErrors(prev => ({ ...prev, full_name: 'Full name must be at least 2 characters' }))
      return false
    }
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.full_name
      return newErrors
    })
    return true
  }

  const validatePhoneNumber = (value: string): boolean => {
    if (authMethod === 'email') {
      if (!value.trim()) {
        setErrors(prev => ({ ...prev, phone_number: 'Phone number is required' }))
        return false
      }
      const phoneRegex = /^\d{10}$/
      const cleanedPhone = value.replace(/\D/g, '')
      if (!phoneRegex.test(cleanedPhone)) {
        setErrors(prev => ({ ...prev, phone_number: 'Please enter a valid 10-digit phone number' }))
        return false
      }
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.phone_number
        return newErrors
      })
    }
    return true
  }

  const validateEmail = (value: string): boolean => {
    if (authMethod === 'phone') {
      if (!value.trim()) {
        setErrors(prev => ({ ...prev, email: 'Email is required' }))
        return false
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
        return false
      }
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.email
        return newErrors
      })
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const isFullNameValid = validateFullName(fullName)
    const isPhoneValid = validatePhoneNumber(phoneNumber)
    const isEmailValid = validateEmail(email)

    if (!isFullNameValid || !isPhoneValid || !isEmailValid) {
      return
    }

    setIsLoading(true)

    try {
      const data: { full_name: string; phone_number?: string; email?: string } = {
        full_name: fullName.trim(),
      }

      if (authMethod === 'email') {
        const cleanedPhone = phoneNumber.replace(/\D/g, '')
        data.phone_number = `+1${cleanedPhone}`
      } else {
        data.email = email.trim()
      }

      await onComplete(data)
    } catch (err) {
      setError('Failed to save profile information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned)
      if (cleaned.length > 0) {
        validatePhoneNumber(cleaned)
      }
    }
  }

  const formatPhoneDisplay = (value: string): string => {
    if (value.length === 0) return ''
    if (value.length <= 3) return value
    if (value.length <= 6) return `${value.slice(0, 3)}-${value.slice(3)}`
    return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Please provide some additional information to get started
          </p>
          {authMethod === 'email' && currentEmail && (
            <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700">
              <Mail size={14} className="mr-1.5" />
              Signed in with {currentEmail}
            </div>
          )}
          {authMethod === 'phone' && currentPhone && (
            <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700">
              <Phone size={14} className="mr-1.5" />
              Signed in with {currentPhone}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (e.target.value.trim().length > 0) {
                  validateFullName(e.target.value)
                }
              }}
              onBlur={() => validateFullName(fullName)}
              className={`w-full px-4 py-3 border ${
                errors.full_name ? 'border-red-300' : 'border-gray-300'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Enter your full name"
              required
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {authMethod === 'email' && (
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500">+1</span>
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => validatePhoneNumber(phoneNumber)}
                  className={`w-full pl-12 pr-4 py-3 border ${
                    errors.phone_number ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="234-567-8900"
                  required
                />
              </div>
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">US phone number (10 digits)</p>
            </div>
          )}

          {authMethod === 'phone' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (e.target.value.trim().length > 0) {
                    validateEmail(e.target.value)
                  }
                }}
                onBlur={() => validateEmail(email)}
                className={`w-full px-4 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="your.email@example.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || Object.keys(errors).length > 0}
            className="btn-black w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <>
                Complete Profile
                <CheckCircle size={16} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This information helps us provide you with a better experience
          </p>
        </div>
      </div>
    </div>
  )
}
