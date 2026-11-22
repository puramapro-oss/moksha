// @vitest-environment jsdom
import { act, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StepDenomination from '@/components/wizard/StepDenomination'
import StepSiege from '@/components/wizard/StepSiege'
import type { WizardData } from './WizardEntreprise'
import { createView, deferred, inputValue } from '@/test/view'

const initial: WizardData = {
  forme: 'sasu', mode: 'standard', denomination: 'Alpha', nom_commercial: '', activite: '', code_ape: '',
  adresse: 'Alpha rue', type_local: 'domicile', capital: 1000, apport_type: 'numeraire',
  dirigeant: { prenom: '', nom: '', date_naissance: '', nationalite: 'Française', adresse: '' },
  optim_zfrr: false, optim_jei: false, accept_cgv: false,
}

function Form({ kind }: { kind: 'name' | 'address' }) {
  const [data, setData] = useState(initial)
  const update = (patch: Partial<WizardData>) => setData((previous) => ({ ...previous, ...patch }))
  return kind === 'name' ? <StepDenomination data={data} update={update} /> : <StepSiege data={data} update={update} />
}

let view: ReturnType<typeof createView>
const request = vi.fn<typeof fetch>()
const response = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } })
const tick = async (milliseconds: number) => act(async () => { vi.advanceTimersByTime(milliseconds) })
const field = () => view.host.querySelector('input')!

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', request)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  request.mockReset()
  view = createView()
})
afterEach(async () => { await view.close(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('recherches du wizard liées à la saisie courante', () => {
  it('ne remplace pas le résultat du nouveau nom par une ancienne réponse', async () => {
    const alpha = deferred<Response>()
    const beta = deferred<Response>()
    request.mockReturnValueOnce(alpha.promise).mockReturnValueOnce(beta.promise)
    await view.render(<Form kind="name" />)
    await tick(500)
    await inputValue(field(), 'Beta')
    await tick(500)
    await act(async () => { beta.resolve(response({ available: false, similar: [{ denomination: 'Beta existant', siren: '123' }] })) })
    await act(async () => { alpha.resolve(response({ available: true, similar: [] })) })
    expect(view.host.textContent).toContain('Beta existant')
    expect(view.host.textContent).not.toContain('Aucune entreprise active ne porte ce nom')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('retire immédiatement une disponibilité dès que la saisie change', async () => {
    request.mockResolvedValueOnce(response({ available: true, similar: [] }))
    await view.render(<Form kind="name" />)
    await tick(500)
    expect(view.host.textContent).toContain('Aucune entreprise active ne porte ce nom')
    await inputValue(field(), 'Beta')
    expect(view.host.textContent).not.toContain('Aucune entreprise active ne porte ce nom')
    await inputValue(field(), 'Ab')
    await tick(1000)
    expect(request).toHaveBeenCalledOnce()
  })

  it('signale un rejet transport du nom sans annoncer sa disponibilité', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    request.mockRejectedValueOnce(new Error('offline'))
    await view.render(<Form kind="name" />)
    await tick(500)
    expect(view.host.querySelector('[role="alert"]')?.textContent).toContain('indisponible')
    expect(view.host.textContent).not.toContain('Aucune entreprise active ne porte ce nom')
  })

  it('ne présente pas les anciennes adresses après une réponse plus récente', async () => {
    const alpha = deferred<Response>()
    const beta = deferred<Response>()
    request.mockReturnValueOnce(alpha.promise).mockReturnValueOnce(beta.promise)
    await view.render(<Form kind="address" />)
    await act(async () => { field().dispatchEvent(new FocusEvent('focusin', { bubbles: true })) })
    await tick(350)
    await inputValue(field(), 'Beta rue')
    await tick(350)
    await act(async () => { beta.resolve(response({ results: [{ label: 'Beta rue', street: 'Beta suggestion', city: 'Paris', postcode: '75001' }] })) })
    await act(async () => { alpha.resolve(response({ results: [{ label: 'Alpha rue', street: 'Alpha suggestion', city: 'Lyon', postcode: '69001' }] })) })
    expect(view.host.textContent).toContain('Beta suggestion')
    expect(view.host.textContent).not.toContain('Alpha suggestion')
  })

  it('retire les suggestions d’adresse quand la recherche devient trop courte', async () => {
    request.mockResolvedValueOnce(response({ results: [{ label: 'Alpha rue', street: 'Alpha suggestion', city: 'Lyon', postcode: '69001' }] }))
    await view.render(<Form kind="address" />)
    await act(async () => { field().dispatchEvent(new FocusEvent('focusin', { bubbles: true })) })
    await tick(350)
    expect(view.host.textContent).toContain('Alpha suggestion')
    await inputValue(field(), 'A')
    expect(view.host.textContent).not.toContain('Alpha suggestion')
    await tick(1000)
    expect(request).toHaveBeenCalledOnce()
  })

  it.each(['name', 'address'] as const)('annule la recherche %s avant le démontage', async (kind) => {
    await view.render(<Form kind={kind} />)
    await view.close()
    await tick(1000)
    expect(request).not.toHaveBeenCalled()
  })

  it('signale un rejet transport d’adresse et arrête son chargement', async () => {
    request.mockRejectedValueOnce(new Error('offline'))
    await view.render(<Form kind="address" />)
    await tick(350)
    expect(view.host.querySelector('[role="alert"]')?.textContent).toContain('indisponible')
    expect(view.host.querySelector('.animate-spin')).toBeNull()
  })
})
