import { useState, useEffect } from 'react'
import { supabase, type Profile } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const newProfile = {
            id: userData.user.id,
            username: userData.user.email?.split('@')[0] || '',
            full_name: userData.user.user_metadata?.full_name || '',
            avatar_url: userData.user.user_metadata?.avatar_url || ''
          }
          
          const { data: createdProfile } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()
          
          setProfile(createdProfile)
        }
      } else if (!error) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
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

  const signInWithPhoneOtp = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    })
    return { data, error }
  }

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
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
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    signInWithGoogle,
    signOut,
  }
}