// @vitest-environment jsdom
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import {
  auth, deferred, enter, entry, host, input, insert,
  notify, read, render, saveButton, switchAccount, type,
  type ReadReply, type WriteReply,
} from './page.test-support'

describe('journal de gratitude — concurrence et identité', () => {
  it('conserve un seul chargement au montage en StrictMode', async () => {
    await render(true)
    expect(read).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledWith('member-a')
  })

  it('conserve le parcours réussi et recharge l’historique après confirmation', async () => {
    const pending = deferred<WriteReply>()
    insert.mockReturnValueOnce(pending.promise)
    await render()
    await type('  Une belle journée  ')
    await enter()
    expect(notify).not.toHaveBeenCalled()
    expect(insert).toHaveBeenCalledWith({ user_id: 'member-a', content: 'Une belle journée' })
    read.mockResolvedValueOnce({ data: [entry('1', 'Une belle journée')], error: null })
    await act(async () => { pending.resolve({ error: null, status: 201 }) })
    expect(notify).toHaveBeenCalledOnce()
    expect(input().value).toBe('')
    expect(host.textContent).toContain('Une belle journée')
    expect(host.textContent).toContain('1/3')
  })

  it('verrouille immédiatement deux pressions Entrée avant le rendu suivant', async () => {
    insert.mockReturnValueOnce(new Promise(() => {}))
    await render()
    await type('Une seule entrée')
    await enter(2)
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('bloque aussi Entrée pendant une écriture déjà affichée en cours', async () => {
    insert.mockReturnValueOnce(new Promise(() => {}))
    await render()
    await type('Une seule entrée')
    await enter()
    await enter()
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('conserve un brouillon modifié pendant la sauvegarde', async () => {
    const pending = deferred<WriteReply>()
    insert.mockReturnValueOnce(pending.promise)
    await render()
    await type('Première gratitude')
    await enter()
    await type('Deuxième brouillon')
    await act(async () => { pending.resolve({ error: null, status: 201 }) })
    expect(input().value).toBe('Deuxième brouillon')
  })

  it('conserve le brouillon révisé même après un aller-retour A → B → A', async () => {
    const pending = deferred<WriteReply>()
    insert.mockReturnValueOnce(pending.promise)
    await render()
    await type('Gratitude A')
    await enter()
    await type('Brouillon B')
    await type('Gratitude A')
    await act(async () => { pending.resolve({ error: null, status: 201 }) })
    expect(input().value).toBe('Gratitude A')
  })

  it('retire immédiatement l’historique et le brouillon du compte précédent', async () => {
    read.mockResolvedValueOnce({ data: [entry('a', 'Historique privé A')], error: null })
    await render()
    await type('Brouillon privé A')
    read.mockReturnValueOnce(new Promise(() => {}))
    await switchAccount('member-b')
    expect(host.textContent).not.toContain('Historique privé A')
    expect(input().value).toBe('')
  })

  it('utilise l’identité authentifiée même si le profil précédent est encore chargé', async () => {
    await render()
    await switchAccount('member-b', 'member-a')
    await type('Gratitude du compte B')
    await enter()
    expect(read).toHaveBeenLastCalledWith('member-b')
    expect(insert).toHaveBeenCalledWith({ user_id: 'member-b', content: 'Gratitude du compte B' })
  })

  it('ignore un historique A reçu après celui du compte B', async () => {
    const previous = deferred<ReadReply>()
    read.mockReturnValueOnce(previous.promise)
    await render()
    read.mockResolvedValueOnce({ data: [entry('b', 'Historique privé B')], error: null })
    await switchAccount('member-b')
    await act(async () => { previous.resolve({ data: [entry('a', 'Historique privé A')], error: null }) })
    expect(host.textContent).toContain('Historique privé B')
    expect(host.textContent).not.toContain('Historique privé A')
  })

  it('ignore une sauvegarde du compte A après un passage B puis retour A', async () => {
    const previous = deferred<WriteReply>()
    insert.mockReturnValueOnce(previous.promise)
    await render()
    await type('Ancienne entrée A')
    await enter()
    await switchAccount('member-b')
    await switchAccount('member-a')
    await type('Nouveau brouillon A')
    const readsBeforeReply = read.mock.calls.length
    await act(async () => { previous.resolve({ error: null, status: 201 }) })
    expect(notify).not.toHaveBeenCalled()
    expect(input().value).toBe('Nouveau brouillon A')
    expect(read).toHaveBeenCalledTimes(readsBeforeReply)
  })

  it('retire les données et interdit les écritures après déconnexion', async () => {
    read.mockResolvedValueOnce({ data: [entry('a', 'Historique privé A')], error: null })
    await render()
    await type('Brouillon privé A')
    await switchAccount(null, 'member-a')
    expect(host.textContent).not.toContain('Historique privé A')
    expect(input().value).toBe('')
    expect(saveButton().disabled).toBe(true)
    await enter()
    expect(insert).not.toHaveBeenCalled()
  })

  it('attend la réception de l’historique avant de vérifier la limite quotidienne', async () => {
    const pending = deferred<ReadReply>()
    read.mockReturnValueOnce(pending.promise)
    await render()
    await type('Quatrième entrée interdite')
    await enter()
    expect(insert).not.toHaveBeenCalled()
    await act(async () => { pending.resolve({ data: [entry('1', 'Un'), entry('2', 'Deux'), entry('3', 'Trois')], error: null }) })
    expect(host.textContent).toContain('3 gratitudes enregistrées')
    expect(saveButton()).toBeNull()
  })

  it('refuse l’écriture si le nombre d’entrées ne peut pas être chargé', async () => {
    read.mockResolvedValueOnce({ data: null, error: { message: 'indisponible' } })
    await render()
    await type('Brouillon conservé')
    await enter()
    expect(host.textContent).toContain('Impossible de charger')
    expect(host.textContent).not.toContain('Écris ta première gratitude')
    expect(insert).not.toHaveBeenCalled()
  })

  it('traite le rejet du transport de lecture comme un échec de chargement', async () => {
    read.mockRejectedValueOnce(new Error('Connexion interrompue'))
    await render()
    expect(host.textContent).toContain('Impossible de charger')
    expect(saveButton().disabled).toBe(true)
  })

  it('reprend une lecture refusée sans envoyer le brouillon', async () => {
    read.mockResolvedValueOnce({ data: null, error: { message: 'indisponible' } })
    await render()
    await type('Brouillon conservé')
    const reload = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Recharger l’historique' || button.textContent === "Recharger l'historique",
    )
    expect(reload).toBeDefined()
    await act(async () => { reload!.click() })
    expect(host.textContent).not.toContain('Impossible de charger')
    expect(input().value).toBe('Brouillon conservé')
    expect(saveButton().disabled).toBe(false)
    expect(insert).not.toHaveBeenCalled()
  })

  it('garde le quota inconnu après une sauvegarde confirmée suivie d’un échec de lecture', async () => {
    await render()
    read.mockRejectedValueOnce(new Error('Lecture interrompue'))
    await type('Entrée confirmée')
    await enter()
    expect(notify).toHaveBeenCalledOnce()
    await type('Nouveau brouillon')
    await enter()
    expect(host.textContent).toContain('Impossible de charger')
    expect(insert).toHaveBeenCalledTimes(1)
    expect(input().value).toBe('Nouveau brouillon')
  })

  it('ignore un échec de lecture du compte précédent', async () => {
    const previous = deferred<ReadReply>()
    read.mockReturnValueOnce(previous.promise)
    await render()
    await switchAccount('member-b')
    await act(async () => { previous.reject(new Error('Lecture A interrompue')) })
    expect(host.textContent).not.toContain('Impossible de charger')
    await type('Gratitude B')
    expect(saveButton().disabled).toBe(false)
  })

  it('ignore le refus du compte précédent sans déverrouiller la sauvegarde courante', async () => {
    const previous = deferred<WriteReply>()
    const current = deferred<WriteReply>()
    insert.mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise)
    await render()
    await type('Gratitude A')
    await enter()
    await switchAccount('member-b')
    await type('Gratitude B')
    await enter()
    await act(async () => { previous.reject(new Error('Écriture A interrompue')) })
    await enter()
    expect(insert).toHaveBeenCalledTimes(2)
    expect(saveButton().disabled).toBe(true)
    expect(host.textContent).not.toContain('Enregistrement non confirmé')
    await act(async () => { current.resolve({ error: null, status: 201 }) })
    expect(notify).toHaveBeenCalledOnce()
  })

  it('n’écrit pas pendant la résolution de la session authentifiée', async () => {
    auth.loading = true
    await render()
    expect(input().disabled).toBe(true)
    await type('Session en attente')
    await enter()
    expect(insert).not.toHaveBeenCalled()
    auth.loading = false
    await render()
    await enter()
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('permet une nouvelle action explicite après un refus certain', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'refusé' }, status: 403 })
    await render()
    await type('Brouillon à conserver')
    await enter()
    expect(input().value).toBe('Brouillon à conserver')
    expect(notify).not.toHaveBeenCalled()
    expect(saveButton().disabled).toBe(false)
    await enter()
    expect(insert).toHaveBeenCalledTimes(2)
    expect(notify).toHaveBeenCalledOnce()
  })

  it.each([undefined, 0, 408, 409, 502])('ne réémet pas après une écriture ambiguë (statut %s)', async (status) => {
    insert.mockResolvedValueOnce({ error: { message: 'indéterminé' }, status })
    await render()
    await type('Écriture non confirmée')
    await enter()
    await enter()
    expect(insert).toHaveBeenCalledTimes(1)
    expect(notify).not.toHaveBeenCalled()
    expect(host.textContent).toContain('Enregistrement non confirmé')
    expect(saveButton().disabled).toBe(true)
    expect(input().value).toBe('Écriture non confirmée')
  })

  it('traite une exception de transport sans réémettre ni annoncer de réussite', async () => {
    insert.mockRejectedValueOnce(new Error('Connexion interrompue'))
    await render()
    await type('Écriture non confirmée')
    await enter()
    await enter()
    expect(insert).toHaveBeenCalledTimes(1)
    expect(host.textContent).toContain('Enregistrement non confirmé')
    expect(notify).not.toHaveBeenCalled()
  })
  it('ne réémet pas dans le même lot React après une réponse ambiguë', async () => {
    const pending = deferred<WriteReply>()
    insert.mockReturnValueOnce(pending.promise)
    await render()
    await type('Issue incertaine')
    await enter()
    await act(async () => {
      pending.resolve({ error: { message: 'transport interrupted' }, status: 0 })
      await pending.promise
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(insert).toHaveBeenCalledTimes(1)
    expect(notify).not.toHaveBeenCalled()
    expect(host.textContent).toContain('Enregistrement non confirmé')
  })
  it('ne franchit pas le quota avant le commit React du dernier historique', async () => {
    const saved = deferred<WriteReply>()
    const refreshed = deferred<ReadReply>()
    const initial = [entry('1', 'Un'), entry('2', 'Deux')]
    read.mockResolvedValueOnce({ data: initial, error: null })
    insert.mockReturnValueOnce(saved.promise)
    await render()
    await type('Troisième gratitude')
    await enter()
    await type('Quatrième gratitude')
    read.mockReturnValueOnce(refreshed.promise)
    await act(async () => {
      saved.resolve({ error: null, status: 201 })
      await saved.promise
      refreshed.resolve({ data: [...initial, entry('3', 'Troisième gratitude')], error: null })
      await refreshed.promise
      await Promise.resolve()
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(insert).toHaveBeenCalledTimes(1)
    expect(host.textContent).toContain('3 gratitudes enregistrées')
  })
})
