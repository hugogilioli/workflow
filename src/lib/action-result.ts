export type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export type Result<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string };