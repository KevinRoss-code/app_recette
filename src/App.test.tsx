// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { db } from './data/db'
import { creer } from './data/recettes'

beforeEach(() => db.recettes.clear())
afterEach(cleanup)

test('créer une recette via le formulaire puis la tirer', async () => {
  render(<App />)
  fireEvent.click(screen.getByText('Recettes'))
  fireEvent.click(await screen.findByText('+ Nouvelle recette'))
  fireEvent.change(screen.getByLabelText(/Titre/), { target: { value: 'Gratin' } })
  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'pommes de terre' } })
  fireEvent.click(screen.getByText('Enregistrer'))
  await screen.findByText('Gratin')

  fireEvent.click(screen.getByText('Tirage'))
  await waitFor(() => {
    fireEvent.click(screen.getByText(/Tirer/))
    expect(screen.getByText('Gratin')).toBeTruthy()
  })
  fireEvent.click(screen.getByText('Valider : en faire le menu'))
  await screen.findByText(/Menu enregistré/)
  await waitFor(async () => expect((await db.recettes.toArray())[0].dernierTirage).toBeTypeOf('number'))
})

test('relancer remplace par une autre recette', async () => {
  await creer({ titre: 'A', portions: 1, ingredients: [], etapes: [], tags: [] })
  await creer({ titre: 'B', portions: 1, ingredients: [], etapes: [], tags: [] })
  await creer({ titre: 'C', portions: 1, ingredients: [], etapes: [], tags: [] })
  render(<App />)
  fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: '2' } })
  await waitFor(() => {
    fireEvent.click(screen.getByText(/Tirer/))
    expect(screen.getAllByText('Relancer')).toHaveLength(2)
  })
  fireEvent.click(screen.getAllByText('Relancer')[0])
  await waitFor(() => expect(screen.getAllByText('Relancer')).toHaveLength(2))
})

test('menu : le tirage validé apparaît, portions modifiables', async () => {
  await creer({ titre: 'Quiche', portions: 2, ingredients: [], etapes: [], tags: [] })
  render(<App />)
  await waitFor(() => {
    fireEvent.click(screen.getByText(/Tirer/))
    expect(screen.getByText('Quiche')).toBeTruthy()
  })
  fireEvent.click(screen.getByText('Valider : en faire le menu'))
  await screen.findByText(/Menu enregistré/)
  fireEvent.click(screen.getByText('Menu'))
  await screen.findByText('2 pers.')
  fireEvent.click(screen.getByLabelText('Plus de portions Quiche'))
  await screen.findByText('3 pers.')
  fireEvent.click(screen.getByText('Retirer'))
  await screen.findByText(/Menu vide/)
})

test('courses : ingrédients du menu agrégés par rayon, cases à cocher, ajout manuel', async () => {
  const ingr = (nom: string, quantite: number) => ({ nom, quantite, unite: 'g', rayon: 'Épicerie' as const })
  await creer({ titre: 'P1', portions: 2, ingredients: [ingr('farine', 100)], etapes: [], tags: [] })
  await creer({ titre: 'P2', portions: 2, ingredients: [ingr('farine', 50)], etapes: [], tags: [] })
  render(<App />)
  await waitFor(() => {
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: '2' } })
    fireEvent.click(screen.getByText(/Tirer/))
    expect(screen.getAllByText('Relancer')).toHaveLength(2)
  })
  fireEvent.click(screen.getByText('Valider : en faire le menu'))
  await screen.findByText(/Menu enregistré/)
  fireEvent.click(screen.getByText('Courses'))
  await screen.findByText('150 g farine')
  await screen.findByRole('heading', { name: 'Épicerie' })
  fireEvent.click(screen.getByLabelText(/150 g farine/))
  await screen.findByText('0 article(s) restant(s) sur 1')
  fireEvent.change(screen.getByPlaceholderText('Article'), { target: { value: 'piles' } })
  fireEvent.click(screen.getByText('Ajouter'))
  await screen.findByText('1 article(s) restant(s) sur 2')
})

test('fiche recette : étapes visibles, quantités selon les portions, depuis la liste et le menu', async () => {
  await creer({
    titre: 'Crêpes', portions: 2, tags: [], etapes: ['Mélanger', 'Cuire à la poêle'],
    ingredients: [{ nom: 'farine', quantite: 100, unite: 'g', rayon: 'Épicerie' }],
  })
  render(<App />)
  fireEvent.click(screen.getByText('Recettes'))
  fireEvent.click(await screen.findByText('Crêpes'))
  await screen.findByText('Cuire à la poêle')
  await screen.findByText('100 g farine')
  fireEvent.click(screen.getByLabelText('Plus de portions'))
  await screen.findByText('150 g farine')
  fireEvent.click(screen.getByText('← Retour'))
  await screen.findByText('+ Nouvelle recette')

  fireEvent.click(screen.getByText('Tirage'))
  await waitFor(() => {
    fireEvent.click(screen.getByText(/Tirer/))
    expect(screen.getByText('Valider : en faire le menu')).toBeTruthy()
  })
  fireEvent.click(screen.getByText('Valider : en faire le menu'))
  await screen.findByText(/Menu enregistré/)
  fireEvent.click(screen.getByText('Menu'))
  await waitFor(() => {
    fireEvent.click(screen.getByText('Crêpes'))
    expect(screen.getByText('100 g farine')).toBeTruthy()
  })
})

test('onglet Compte : message clair quand la synchronisation n\'est pas configurée', async () => {
  render(<App />)
  fireEvent.click(screen.getByText('Compte'))
  await screen.findByText(/n'est pas configurée/)
})
