import { useState, useEffect } from 'react'
import { supabase, type Profile } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const getProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData.user

      if (!currentUser) {
        setLoading(false)
        return
      }

      const userAuthMethod = currentUser.phone ? 'phone' : 'email'
      setAuthMethod(userAuthMethod)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        setLoading(false)
        return
      }

      if (!data) {
        const newProfile = {
          id: currentUser.id,
          username: currentUser.email?.split('@')[0] || currentUser.phone?.slice(-4) || 'user',
          full_name: currentUser.user_metadata?.full_name || '',
          avatar_url: currentUser.user_metadata?.avatar_url || '',
          email: userAuthMethod === 'phone' ? '' : currentUser.email,
          phone_number: userAuthMethod === 'email' ? '' : currentUser.phone
        }

        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle()

        if (createdProfile) {
          setProfile(createdProfile)
          checkProfileCompleteness(createdProfile, userAuthMethod)
        }
      } else {
        setProfile(data)
        checkProfileCompleteness(data, userAuthMethod)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkProfileCompleteness = (profile: Profile, method: 'email' | 'phone') => {
    const missingFullName = !profile.full_name || profile.full_name.trim() === ''
    const missingPhone = method === 'email' && (!profile.phone_number || profile.phone_number.trim() === '')
    const missingEmail = method === 'phone' && (!profile.email || profile.email.trim() === '')

    const isIncomplete = missingFullName || missingPhone || missingEmail
    setNeedsProfileCompletion(isIncomplete)
  }

  const completeProfile = async (data: { full_name: string; phone_number?: string; email?: string }) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    const updateData: Partial<Profile> = {
      full_name: data.full_name,
      updated_at: new Date().toISOString()
    }

    if (data.phone_number) {
      updateData.phone_number = data.phone_number
    }

    if (data.email) {
      updateData.email = data.email
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    setProfile(updatedProfile)
    setNeedsProfileCompletion(false)

    return updatedProfile
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })
    return { data, error }
  }

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    return { data, error }
  }

  const signInWithPhone = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    })
    return { data, error }
  }

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    profile,
    loading,
    needsProfileCompletion,
    authMethod,
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithPhone,
    verifyOtp,
    signOut,
    completeProfile,
  }
}