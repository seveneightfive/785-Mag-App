import React, { useState } from 'react'
import { X, ArrowRight, CheckCircle, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+1')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const { signInWithMagicLink, signInWithPhone, verifyOtp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (authMethod === 'email' && !email) return
    if (authMethod === 'phone' && !phone) return

    setIsLoading(true)
    setError('')

    try {
      if (authMethod === 'email') {
        const { error } = await signInWithMagicLink(email)
        if (error) {
          setError(error.message)
        } else {
          setIsEmailSent(true)
        }
      } else {
        const { error } = await signInWithPhone(phone)
        if (error) {
          setError(error.message)
        } else {
          setIsOtpSent(true)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !phone) return

    setIsLoading(true)
    setError('')

    try {
      const { error } = await verifyOtp(phone, otp)
      if (error) {
        setError(error.message)
      } else {
        handleClose()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPhone('+1')
    setOtp('')
    setIsEmailSent(false)
    setIsOtpSent(false)
    setError('')
    setIsLoading(false)
    setAuthMethod('email')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {!isEmailSent && !isOtpSent ? (
          <>
            <div className="text-center mb-6">
              <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <img
                  src="/785 Logo Valentine.png"
                  alt="785 Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'signin' ? 'Welcome back' : 'Join EventHub'}
              </h2>
              <p className="text-gray-600">
                {mode === 'signin'
                  ? authMethod === 'email'
                    ? 'Enter your email to sign in to your account'
                    : 'Enter your phone number to sign in to your account'
                  : authMethod === 'email'
                    ? 'Enter your email to create your account'
                    : 'Enter your phone number to create your account'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMethod === 'email' ? (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (authMethod === 'email' ? !email : !phone)}
                className="btn-black w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <>
                    {authMethod === 'email'
                      ? (mode === 'signin' ? 'Send sign in link' : 'Send sign up link')
                      : 'Send verification code'
                    }
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMethod(authMethod === 'email' ? 'phone' : 'email')
                  if (authMethod === 'email') {
                    setPhone('+1')
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {authMethod === 'email' ? 'Sign in with phone number' : 'Sign in with email'}
              </button>
            </div>
          </>
        ) : isOtpSent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter verification code</h2>
            <p className="text-gray-600 mb-6">
              We've sent a code to <strong>{phone}</strong>.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="btn-black w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <>
                    Verify and sign in
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => {
                setIsOtpSent(false)
                setOtp('')
                setError('')
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Use a different number
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a magic link to <strong>{email}</strong>. 
              Click the link in the email to {mode === 'signin' ? 'sign in' : 'complete your signup'}.
            </p>
            <button
              onClick={handleClose}
              className="btn-white"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  )
}