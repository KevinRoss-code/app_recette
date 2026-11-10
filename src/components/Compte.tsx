import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { lister } from '../data/recettes'
import { useCloud, type EtatCloud } from './CloudProvider'

const LIBELLES: Record<EtatCloud, string> = {
  'non-configure': 'Synchronisation non configurée',
  deconnecte: 'Non connecté',
  repos: 'Connecté',
  synchro: 'Synchronisation en cours…',
  ok: 'Synchronisé ✓',
  'hors-ligne': 'Hors-ligne : sera synchronisé au retour du réseau',
  erreur: 'Erreur de synchronisation',
}

export default function Compte() {
  const cloud = useCloud()
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  const nbRecettes = useLiveQuery(async () => (await lister()).length, [], 0)

  async function agir(action: (e: string, m: string) => Promise<void>) {
    setErreur('')
    setOccupe(true)
    try {
      await action(email.trim(), mdp)
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setOccupe(false)
    }
  }

  if (cloud.etat === 'non-configure') {
    return (
      <section>
        <h2>Compte et synchronisation</h2>
        <div className="vide"><span>☁️</span>La synchronisation n'est pas configurée sur cette version. Vos recettes restent enregistrées sur cet appareil.</div>
      </section>
    )
  }

  return (
    <section>
      <h2>Compte et synchronisation</h2>
      <p className="meta" role="status">{LIBELLES[cloud.etat]}{cloud.derniere ? ` · ${new Date(cloud.derniere).toLocaleTimeString('fr-FR')}` : ''}</p>
      {cloud.message && <p className="err">{cloud.message}</p>}
      <p className="meta">
        Sur cet appareil : {nbRecettes} recette(s).
        {cloud.bilan ? ` Dernière synchro : ${cloud.bilan.recues} reçue(s), ${cloud.bilan.envoyees} envoyée(s).` : ''}
      </p>
      {cloud.email ? (
        <div className="carte">
          <p>Connecté en tant que <strong>{cloud.email}</strong></p>
          <div className="actions">
            <button className="primary" disabled={cloud.etat === 'synchro'} onClick={() => void cloud.synchroniserMaintenant()}>Synchroniser maintenant</button>
            <button disabled={cloud.etat === 'synchro'} onClick={() => void cloud.synchroniserMaintenant(true)}>Tout renvoyer (réparation)</button>
            <button className="danger" onClick={() => void cloud.deconnecter()}>Se déconnecter</button>
          </div>
          <p className="meta">Vos recettes restent aussi sur cet appareil après déconnexion.</p>
        </div>
      ) : (
        <form className="carte form" onSubmit={(e) => { e.preventDefault(); void agir(cloud.connecter) }}>
          <label>E-mail <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Mot de passe <input type="password" autoComplete="current-password" minLength={6} required value={mdp} onChange={(e) => setMdp(e.target.value)} /></label>
          {erreur && <p className="err" role="alert">{erreur}</p>}
          <div className="actions">
            <button className="primary" type="submit" disabled={occupe}>Se connecter</button>
            <button type="button" disabled={occupe || !email || mdp.length < 6} onClick={() => void agir(cloud.creerCompte)}>Créer le compte</button>
          </div>
        </form>
      )}
      <p className="meta">Version {__BUILD__}</p>
    </section>
  )
}
