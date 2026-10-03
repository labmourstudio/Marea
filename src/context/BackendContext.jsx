import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { missingResource } from '../lib/publicProjects'
import { supabase } from '../lib/supabase'

const BackendContext = createContext({ loading: true, project_workspace: false, polls: false, error: '' })
export function BackendProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ userId: null, loading: true, project_workspace: false, polls: false, error: '' })
  useEffect(() => {
    let active = true
    if (!supabase || !user) return undefined
    supabase.rpc('mora_capabilities').then(({ data, error }) => {
      if (active) setState({ userId: user.id, loading: false, ...(data || {}), error: error && !missingResource(error) ? error.message : '' })
    }).catch((error) => { if (active) setState({ userId: user.id, loading: false, error: error.message }) })
    return () => { active = false }
  }, [user?.id])
  const value = state.userId === user?.id ? state : { loading: !!user, project_workspace: false, polls: false, error: '' }
  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
}
export const useBackend = () => useContext(BackendContext)
