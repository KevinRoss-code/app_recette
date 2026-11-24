import { describe, expect, test } from 'vitest'
import { validerLot, validerRecette } from './validationRecettes'

const ok = () => ({
  titre: 'Gratin de courge au comté', portions: 4, tempsMinutes: 55,
  tags: ['automne', 'soir', 'équilibré', 'végétarien', 'four', 'gratin'],
  ingredients: [
    { nom: 'courge butternut', quantite: 1, unite: 'kg', rayon: 'Fruits et légumes' },
    { nom: 'comté râpé', quantite: 120, unite: 'g', rayon: 'Crèmerie' },
    { nom: 'crème fraîche', quantite: 20, unite: 'cl', rayon: 'Crèmerie' },
    { nom: 'sel', quantite: 0, unite: '', rayon: 'Épicerie' },
  ],
  etapes: ['Préchauffer le four à 180 °C.', 'Éplucher et couper la courge en dés.', 'Mélanger avec la crème et le comté puis enfourner 40 minutes.'],
})
const avec = (m: (r: ReturnType<typeof ok>) => void) => { const r = ok(); m(r); return validerRecette(r) }

describe('validerRecette', () => {
  test('recette valide', () => expect(validerRecette(ok())).toEqual([]))
  test('portions, temps, clé inconnue', () => {
    expect(avec((r) => { r.portions = 2 })).toContain('portions doit valoir 4')
    expect(avec((r) => { r.tempsMinutes = 400 })[0]).toMatch(/tempsMinutes/)
    expect(avec((r) => { (r as Record<string, unknown>).auteur = 'x' })[0]).toMatch(/clé inconnue/)
  })
  test('tags : un par catégorie, vocabulaire fermé', () => {
    expect(avec((r) => { r.tags = ['automne', 'soir', 'végétarien'] }).join()).toMatch(/niveau/)
    expect(avec((r) => { r.tags.push('exotique') })).toContain('tag inconnu « exotique »')
    expect(avec((r) => { r.tags.push('rapide') })).toContain('tag rapide mais plus de 30 minutes')
  })
  test('unité, rayon, plafond, quantité zéro, doublon', () => {
    expect(avec((r) => { r.ingredients[1].unite = 'tasse' }).join()).toMatch(/unité/)
    expect(avec((r) => { r.ingredients[1].rayon = 'Frais' as never }).join()).toMatch(/rayon/)
    expect(avec((r) => { r.ingredients[1].quantite = 9000 }).join()).toMatch(/plafond/)
    expect(avec((r) => { r.ingredients[1].quantite = 0 }).join()).toMatch(/quantité 0/)
    expect(avec((r) => { r.ingredients.push({ ...r.ingredients[1] }) }).join()).toMatch(/en double/)
    expect(avec((r) => { r.ingredients[1].nom = '120 g de comté' }).join()).toMatch(/nom invalide/)
  })
  test('étapes trop courtes ou trop peu nombreuses', () => {
    expect(avec((r) => { r.etapes = ['Cuire.', 'Servir.', 'Manger.'] }).join()).toMatch(/étape 1/)
    expect(avec((r) => { r.etapes = r.etapes.slice(0, 2) })).toContain('etapes : 3 à 10')
  })
  test('hors saison', () => {
    expect(avec((r) => { r.tags[0] = 'été' }).join()).toMatch(/hors saison pour été : « courge/)
    expect(avec((r) => { r.ingredients.push({ nom: 'courgettes', quantite: 2, unite: '', rayon: 'Fruits et légumes' }); r.tags[0] = 'hiver' }).join()).toMatch(/hors saison pour hiver/)
  })
  test('surgelés et conserves autorisés hors saison, frais refusés', () => {
    const hiver = (nom: string, rayon: string) => avec((r) => {
      r.tags[0] = 'hiver'; r.tags[3] = 'végétarien'
      r.ingredients.push({ nom, quantite: 200, unite: 'g', rayon: rayon as never })
    })
    expect(hiver('petits pois', 'Surgelés')).toEqual([])
    expect(hiver('haricots verts en conserve', 'Épicerie')).toEqual([])
    expect(hiver('petits pois', 'Fruits et légumes').join()).toMatch(/hors saison pour hiver/)
  })
  test('cohérence du type', () => {
    expect(avec((r) => { r.ingredients.push({ nom: 'lardons', quantite: 150, unite: 'g', rayon: 'Boucherie / Poissonnerie' }) }).join()).toMatch(/végétarien mais contient/)
    expect(avec((r) => { r.tags[3] = 'poisson' }).join()).toMatch(/type poisson/)
    expect(avec((r) => { r.tags[3] = 'viande' }).join()).toMatch(/type viande/)
    const poisson = (nom: string) => avec((r) => { r.tags[3] = 'poisson'; r.ingredients.push({ nom, quantite: 400, unite: 'g', rayon: 'Boucherie / Poissonnerie' }) })
    expect(poisson('filet de daurade')).toEqual([])
    expect(poisson('dorade royale')).toEqual([])
  })
})

describe('validerLot', () => {
  test('doublon de titre, cellule attendue, effectif', () => {
    const a = ok(), b = { ...ok(), titre: 'gratin de courge au comte' }
    const { erreurs } = validerLot([a, b], { saison: 'hiver', attendu: 3 })
    expect(erreurs.join('\n')).toMatch(/doublon du #1/)
    expect(erreurs.join('\n')).toMatch(/saison « automne » au lieu de « hiver »/)
    expect(erreurs.join('\n')).toMatch(/2 recettes au lieu de 3/)
  })
  test('statistiques par tag', () => {
    expect(validerLot([ok()]).stats.saison).toEqual({ automne: 1 })
  })
})
