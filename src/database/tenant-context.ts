// Token de inyección para el EntityManager de la transacción del request actual.
// Ver request-transaction.middleware.ts y tenant-repository.provider.ts.
export const REQUEST_MANAGER = Symbol('REQUEST_MANAGER');
