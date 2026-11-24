import { RAYONS } from '../domain/types'

export const SAISONS = ['printemps', 'été', 'automne', 'hiver'] as const
export const REPAS = ['midi', 'soir'] as const
export const NIVEAUX = ['léger', 'équilibré', 'riche'] as const
export const TYPES = ['viande', 'volaille', 'poisson', 'végétarien'] as const
export const EXTRAS = ['rapide', 'mijoté', 'four', 'salade', 'soupe', 'pâtes', 'riz', 'gratin', 'tarte', 'wok'] as const
export const UNITES = ['', 'g', 'kg', 'ml', 'cl', 'l', 'c. à soupe', 'c. à café', 'pincée', 'gousse', 'botte', 'brin', 'tranche', 'boîte', 'sachet'] as const

const MAX: Record<string, number> = {
  '': 24, g: 3000, kg: 5, ml: 2000, cl: 200, l: 3, 'c. à soupe': 12, 'c. à café': 6,
  pincée: 6, gousse: 12, botte: 4, brin: 20, tranche: 16, boîte: 4, sachet: 4,
}
const ZERO_OK = ['sel', 'poivre', 'sel et poivre', 'eau']
const CLES = ['titre', 'portions', 'tempsMinutes', 'tags', 'ingredients', 'etapes']

const norme = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const mots = (liste: string) => new RegExp(`\\b(?:${liste})\\b`)

const HORS_SAISON: Record<string, RegExp> = {
  hiver: mots('courgettes?|aubergines?|poivrons?|concombres?|melons?|peches?|abricots?|nectarines?|haricots verts?|asperges?|petits pois|fraises?|cerises?|pasteques?|framboises?'),
  ete: mots('potimarrons?|courges?|butternuts?|citrouilles?|potirons?|chataignes?|marrons?|endives?|topinambours?|panais|choux?|choux-fleurs?|celeri-raves?|salsifis|navets?|mache'),
  automne: mots('asperges?|petits pois|feves?|fraises?|rhubarbe|melons?|pasteques?|nectarines?|framboises?'),
  printemps: mots('potimarrons?|courges?|butternuts?|citrouilles?|potirons?|chataignes?|topinambours?|panais|aubergines?|poivrons?|melons?|pasteques?|nectarines?|peches?'),
}

const VIANDE = mots('boeuf|bœuf|porc|veau|agneau|jambon|lardons?|saucisses?|chorizo|bacon|steaks?|merguez|andouillette|cotes? de|gigot|rumsteck|bavette|entrecote|hache|paleron|joue|travers|poitrine|boudin|rillettes|lapin|chipolatas?|filet mignon|viande')
const VOLAILLE = mots('poulet|dinde|canard|pintade|magret|caille')
const POISSON = mots('saumon|cabillaud|thon|merlu|lieu|colin|truite|dorade|bar|sardines?|maquereaux?|crevettes?|gambas|moules?|saint-jacques|calamars?|encornets?|poulpe|haddock|morue|sole|raie|anchois|crabe|surimi|poisson|langoustines?|coquillages?|lotte|julienne|eglefin|hareng|fletan|palourdes?|daurades?|dorades?|rougets?|turbot|espadon|sandre|brochet|limande|loup de mer|saint-pierre|tilapia|pangasius|mulet|chinchard|merlan|bulots?|huitres?|coques|couteaux|seiche|tourteau|homard|langouste|ecrevisses?')
const CONSERVE = mots('surgeles?|surgelees?|congeles?|en conserve|en boite|seches?|sechees?|deshydrates?|confits?')
const BOUILLON_ANIMAL = mots('bouillon de (?:boeuf|bœuf|poulet|volaille|viande|veau)|fond de (?:veau|volaille|boeuf)|gelatine')

export interface Options {
  saison?: string
  repas?: string
  niveau?: string
  attendu?: number
}

export function validerRecette(brut: unknown): string[] {
  const e: string[] = []
  if (typeof brut !== 'object' || brut === null || Array.isArray(brut)) return ['pas un objet']
  const r = brut as Record<string, unknown>
  for (const k of Object.keys(r)) if (!CLES.includes(k)) e.push(`clé inconnue « ${k} »`)

  const titre = r.titre
  if (typeof titre !== 'string' || titre.trim() !== titre || titre.length < 5 || titre.length > 80) e.push('titre invalide (5 à 80 caractères, sans espaces autour)')
  if (r.portions !== 4) e.push('portions doit valoir 4')
  if (!Number.isInteger(r.tempsMinutes) || (r.tempsMinutes as number) < 5 || (r.tempsMinutes as number) > 240) e.push('tempsMinutes entier entre 5 et 240')

  const tags = Array.isArray(r.tags) && r.tags.every((t) => typeof t === 'string') ? (r.tags as string[]) : null
  let saison = '', type = ''
  if (!tags) e.push('tags invalide')
  else {
    const un = (nom: string, liste: readonly string[]) => {
      const t = tags.filter((x) => liste.includes(x))
      if (t.length !== 1) e.push(`il faut exactement un tag ${nom} parmi ${liste.join('/')}`)
      return t[0] ?? ''
    }
    saison = un('saison', SAISONS); un('repas', REPAS); un('niveau', NIVEAUX); type = un('type', TYPES)
    const connus = [...SAISONS, ...REPAS, ...NIVEAUX, ...TYPES, ...EXTRAS] as string[]
    for (const t of tags) if (!connus.includes(t)) e.push(`tag inconnu « ${t} »`)
    if (new Set(tags).size !== tags.length) e.push('tags en double')
    if (tags.includes('rapide') && typeof r.tempsMinutes === 'number' && r.tempsMinutes > 30) e.push('tag rapide mais plus de 30 minutes')
    if (tags.includes('mijoté') && typeof r.tempsMinutes === 'number' && r.tempsMinutes < 45) e.push('tag mijoté mais moins de 45 minutes')
  }

  const noms: string[] = []
  const frais: string[] = []
  if (!Array.isArray(r.ingredients) || r.ingredients.length < 3 || r.ingredients.length > 18) e.push('ingredients : 3 à 18 lignes')
  else {
    const vus = new Set<string>()
    r.ingredients.forEach((raw, i) => {
      const g = raw as Record<string, unknown>
      const p = `ingrédient ${i + 1}`
      if (typeof g !== 'object' || g === null) return e.push(`${p} : pas un objet`)
      if (Object.keys(g).some((k) => !['nom', 'quantite', 'unite', 'rayon'].includes(k))) e.push(`${p} : clé inconnue`)
      if (typeof g.nom !== 'string' || g.nom.trim() !== g.nom || g.nom.length < 2 || g.nom.length > 60 || /^\d/.test(g.nom)) return e.push(`${p} : nom invalide (sans quantité, sans espaces autour)`)
      noms.push(norme(g.nom))
      if (g.rayon !== 'Surgelés' && !CONSERVE.test(norme(g.nom))) frais.push(norme(g.nom))
      if (!UNITES.includes(g.unite as never)) e.push(`${p} « ${g.nom} » : unité « ${String(g.unite)} » non autorisée`)
      else if (typeof g.quantite !== 'number' || !(g.quantite >= 0) || !Number.isFinite(g.quantite)) e.push(`${p} « ${g.nom} » : quantité invalide`)
      else {
        if (g.quantite === 0 && !ZERO_OK.includes(norme(g.nom))) e.push(`${p} « ${g.nom} » : quantité 0 réservée à sel/poivre/eau`)
        if (g.quantite > MAX[g.unite as string]) e.push(`${p} « ${g.nom} » : ${g.quantite} ${g.unite} dépasse le plafond plausible (${MAX[g.unite as string]})`)
      }
      if (!(RAYONS as readonly string[]).includes(g.rayon as string)) e.push(`${p} « ${g.nom} » : rayon « ${String(g.rayon)} » inconnu`)
      const cle = `${norme(g.nom)}|${String(g.unite)}`
      if (vus.has(cle)) e.push(`${p} « ${g.nom} » en double`)
      vus.add(cle)
    })
  }

  if (!Array.isArray(r.etapes) || r.etapes.length < 3 || r.etapes.length > 10) e.push('etapes : 3 à 10')
  else r.etapes.forEach((s, i) => {
    if (typeof s !== 'string' || s.trim() !== s || s.length < 15 || s.length > 500) e.push(`étape ${i + 1} : 15 à 500 caractères`)
  })

  const texte = noms.join(' | ')
  const horsSaison = saison ? HORS_SAISON[norme(saison)] : undefined
  const intrus = horsSaison && frais.join(' | ').match(horsSaison)
  if (intrus) e.push(`ingrédient hors saison pour ${saison} : « ${intrus[0]} »`)
  const aViande = VIANDE.test(texte), aVolaille = VOLAILLE.test(texte), aPoisson = POISSON.test(texte)
  if (type === 'végétarien' && (aViande || aVolaille || aPoisson || BOUILLON_ANIMAL.test(texte))) e.push('type végétarien mais contient un produit animal (viande/poisson/bouillon/gélatine)')
  if (type === 'viande' && !aViande) e.push('type viande mais aucun ingrédient de viande reconnu')
  if (type === 'volaille' && !aVolaille) e.push('type volaille mais aucune volaille reconnue')
  if (type === 'poisson' && !aPoisson) e.push('type poisson mais aucun poisson/fruit de mer reconnu')
  return e
}

export function validerLot(recettes: unknown[], o: Options = {}) {
  const erreurs: string[] = []
  const titres = new Map<string, number>()
  const stats = { saison: {} as Record<string, number>, repas: {} as Record<string, number>, niveau: {} as Record<string, number>, type: {} as Record<string, number> }
  recettes.forEach((r, i) => {
    const t = (r as { titre?: unknown })?.titre
    const nom = typeof t === 'string' ? `« ${t} »` : ''
    for (const m of validerRecette(r)) erreurs.push(`#${i + 1} ${nom} : ${m}`)
    if (typeof t === 'string') {
      const k = norme(t).replace(/[^a-z0-9]+/g, ' ').trim()
      if (titres.has(k)) erreurs.push(`#${i + 1} ${nom} : doublon du #${titres.get(k)}`)
      else titres.set(k, i + 1)
    }
    const tags = (r as { tags?: unknown })?.tags
    if (Array.isArray(tags)) {
      for (const [cat, liste, attendu] of [['saison', SAISONS, o.saison], ['repas', REPAS, o.repas], ['niveau', NIVEAUX, o.niveau], ['type', TYPES, undefined]] as const) {
        const t1 = tags.find((x) => (liste as readonly string[]).includes(x))
        if (t1) stats[cat][t1] = (stats[cat][t1] ?? 0) + 1
        if (attendu && t1 && t1 !== attendu) erreurs.push(`#${i + 1} ${nom} : ${cat} « ${t1} » au lieu de « ${attendu} »`)
      }
    }
  })
  if (o.attendu !== undefined && recettes.length !== o.attendu) erreurs.push(`${recettes.length} recettes au lieu de ${o.attendu}`)
  return { erreurs, stats }
}
