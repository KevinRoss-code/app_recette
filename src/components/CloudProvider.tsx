import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { backendSupabase, cloudConfigure, supabase } from '../data/cloud'
import { db } from '../data/db'
import { applicationEnCours, synchroniser } from '../data/sync'

export type EtatCloud = 'non-configure' | 'deconnecte' | 'repos' | 'synchro' | 'ok' | 'hors-ligne' | 'erreur'

interface Cloud {
  etat: EtatCloud
  email?: string
  derniere: number | null
  message: string
  synchroniserMaintenant: () => Promise<void>
  connecter: (email: string, mdp: string) => Promise<void>
  creerCompte: (email: string, mdp: string) => Promise<void>
  deconnecter: () => Promise<void>
}

const Ctx = createContext<Cloud | null>(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useCloud = () => useContext(Ctx)!

const DELAI_MS = 3000

export function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [etat, setEtat] = useState<EtatCloud>(cloudConfigure ? 'deconnecte' : 'non-configure')
  const [derniere, setDerniere] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const enCours = useRef(false)
  const relance = useRef(false)
  const minuteur = useRef<ReturnType<typeof setTimeout>>()
  const connecte = Boolean(session)

  const synchroniserMaintenant = useCallback(async () => {
    if (!supabase || !connecte) return
    if (!navigator.onLine) return setEtat('hors-ligne')
    if (enCours.current) { relance.current = true; return }
    enCours.current = true
    setEtat('synchro')
    try {
      await synchroniser(backendSupabase(supabase))
      setEtat('ok')
      setMessage('')
      setDerniere(Date.now())
    } catch (e) {
      setEtat('erreur')
      setMessage((e as Error).message)
    } finally {
      enCours.current = false
      if (relance.current) { relance.current = false; void synchroniserMaintenant() }
    }
  }, [connecte])

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setEtat('deconnecte')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!connecte) return
    void synchroniserMaintenant()
    const planifier = () => {
      if (applicationEnCours) return
      clearTimeout(minuteur.current)
      minuteur.current = setTimeout(() => void synchroniserMaintenant(), DELAI_MS)
    }
    const surVisible = () => document.visibilityState === 'visible' && void synchroniserMaintenant()
    const surRetourReseau = () => void synchroniserMaintenant()
    const surChangement = () => { planifier() }
    const tables = [db.recettes, db.menu, db.coches, db.articles]
    const evenements = ['creating', 'updating', 'deleting'] as const
    tables.forEach((t) => evenements.forEach((e) => t.hook(e as 'creating', surChangement)))
    document.addEventListener('visibilitychange', surVisible)
    window.addEventListener('online', surRetourReseau)
    return () => {
      clearTimeout(minuteur.current)
      tables.forEach((t) => evenements.forEach((e) => t.hook(e as 'creating').unsubscribe(surChangement)))
      document.removeEventListener('visibilitychange', surVisible)
      window.removeEventListener('online', surRetourReseau)
    }
  }, [connecte, synchroniserMaintenant])

  async function connecter(email: string, mdp: string) {
    const { error } = await supabase!.auth.signInWithPassword({ email, password: mdp })
    if (error) throw new Error(error.message)
  }
  async function creerCompte(email: string, mdp: string) {
    const { data, error } = await supabase!.auth.signUp({ email, password: mdp })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Compte créé : confirmez votre e-mail puis connectez-vous.')
  }
  async function deconnecter() {
    await supabase!.auth.signOut()
  }

  return (
    <Ctx.Provider value={{ etat, email: session?.user.email, derniere, message, synchroniserMaintenant, connecter, creerCompte, deconnecter }}>
      {children}
    </Ctx.Provider>
  )
}
