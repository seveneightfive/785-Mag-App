import React, { useState } from 'react'
import { X, Mail, ArrowRight, CheckCircle, Loader, Phone, MessageSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [error, setError] = useState('')
  const { signInWithMagicLink, signInWithPhoneOtp, verifyPhoneOtp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (authMethod === 'email' && !email) return
    if (authMethod === 'phone' && !phone && !isOtpSent) return
    if (authMethod === 'phone' && isOtpSent && !otpCode) return

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
      } else if (authMethod === 'phone') {
        if (!isOtpSent) {
          // Send OTP
          const { error } = await signInWithPhoneOtp(phone)
          if (error) {
            setError(error.message)
          } else {
            setIsOtpSent(true)
          }
        } else {
          // Verify OTP
          const { error } = await verifyPhoneOtp(phone, otpCode)
          if (error) {
            setError(error.message)
          } else {
            handleClose()
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      } else {
        // OAuth will redirect, so we don't need to do anything else
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPhone('')
    setOtpCode('')
    setAuthMethod('email')
    setIsEmailSent(false)
    setIsOtpSent(false)
    setError('')
    setIsLoading(false)
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {authMethod === 'email' ? (
                  <Mail size={24} className="text-white" />
                ) : (
                  <Phone size={24} className="text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'signin' ? 'Welcome back' : 'Join EventHub'}
              </h2>
              <p className="text-gray-600">
                {mode === 'signin' 
                  ? `Enter your ${authMethod} to sign in to your account`
                  : `Enter your ${authMethod} to create your account`
                }
              </p>
            </div>

            {/* Auth Method Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail size={16} />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone size={16} />
                <span>Phone</span>
              </button>
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
                    placeholder="Enter your phone number"
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
                disabled={isLoading || (authMethod === 'email' && !email) || (authMethod === 'phone' && !phone)}
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

            {/* Google Sign In */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

          </>
        ) : authMethod === 'phone' && isOtpSent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter verification code</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification code to <strong>{phone}</strong>. 
              Enter the code below to continue.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
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
                disabled={isLoading || !otpCode}
                className="btn-black w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>
            
            <button
              onClick={() => {
                setIsOtpSent(false)
                setOtpCode('')
                setError('')
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to phone number
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