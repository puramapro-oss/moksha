/**
 * MOKSHA V7.1 — Types locaux pour javascript-opentimestamps (V4.1 §36.2)
 * La lib upstream n'expose pas de .d.ts. Définition minimale couvrant
 * les usages MOKSHA : stamp / verify / DetachedTimestampFile / Ops.OpSHA256.
 */

declare module 'javascript-opentimestamps' {
  export class OpSHA256 {}

  export const Ops: {
    OpSHA256: typeof OpSHA256
  }

  export class DetachedTimestampFile {
    static fromHash(op: OpSHA256, hash: Buffer | Uint8Array): DetachedTimestampFile
    static deserialize(bytes: Buffer | Uint8Array): DetachedTimestampFile
    serializeToBytes(): Uint8Array
    fileHash(): Uint8Array
  }

  export interface VerifyResult {
    bitcoin?: { height: number; timestamp: number }
    litecoin?: { height: number; timestamp: number }
    ethereum?: { height: number; timestamp: number }
  }

  export function stamp(file: DetachedTimestampFile): Promise<void>
  export function verify(
    proof: DetachedTimestampFile,
    original: DetachedTimestampFile,
  ): Promise<VerifyResult>
  export function upgrade(file: DetachedTimestampFile): Promise<boolean>
  export function info(file: DetachedTimestampFile): string

  const OpenTimestamps: {
    Ops: typeof Ops
    DetachedTimestampFile: typeof DetachedTimestampFile
    stamp: typeof stamp
    verify: typeof verify
    upgrade: typeof upgrade
    info: typeof info
  }

  export default OpenTimestamps
}
