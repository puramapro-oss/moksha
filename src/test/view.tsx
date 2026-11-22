import { act, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

export function createView() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  let root: Root | null = null
  return {
    host,
    async render(node: ReactNode) {
      root ??= createRoot(host)
      await act(async () => { root!.render(node) })
    },
    async hydrate(markup: string, node: ReactNode, onRecoverableError: (error: unknown) => void) {
      host.innerHTML = markup
      await act(async () => { root = hydrateRoot(host, node, { onRecoverableError }) })
    },
    async close() {
      if (root) await act(async () => { root!.unmount() })
      root = null
      host.remove()
    },
  }
}

export async function inputValue(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
