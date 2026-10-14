export * from './user';
export * from './product';
export * from './cart';
export * from './order';
export * from './review';

/** Resultado generico de las capas `services/*`: nunca lanzan, siempre devuelven este shape. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
