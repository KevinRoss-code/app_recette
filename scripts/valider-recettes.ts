import { readFileSync } from 'node:fs'
import { validerLot } from '../src/data/validationRecettes'

const args = process.argv.slice(2)
const opt = (nom: string) => { const i = args.indexOf(`--${nom}`); return i >= 0 ? args[i + 1] : undefined }
const fichiers = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
const attendu = opt('attendu')

const recettes = fichiers.flatMap((f) => {
  try { return JSON.parse(readFileSync(f, 'utf8')) as unknown[] }
  catch (e) { console.error(`${f} : JSON illisible (${(e as Error).message})`); process.exit(2) }
})
const { erreurs, stats } = validerLot(recettes, { saison: opt('saison'), repas: opt('repas'), niveau: opt('niveau'), attendu: attendu ? Number(attendu) : undefined })
console.log(`${recettes.length} recettes lues dans ${fichiers.length} fichier(s)`)
console.log(JSON.stringify(stats))
if (erreurs.length) { console.log(`${erreurs.length} erreur(s) :`); erreurs.slice(0, 60).forEach((m) => console.log(' - ' + m)); process.exit(1) }
console.log('OK : aucune erreur')
