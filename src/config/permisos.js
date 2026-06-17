// Roles permitidos por ruta (undefined = cualquier usuario autenticado)
// 'admin' siempre tiene acceso a todo
export const ROLES_POR_RUTA = {
  '/usuarios':         ['admin'],
  '/dashboard':        ['admin', 'gestor'],
  '/historial':        ['admin', 'gestor'],
  '/historial-pagos':  ['admin', 'gestor', 'cobrador'],
  '/agregar-cliente':  ['admin', 'gestor'],
  '/editar-cliente':   ['admin', 'gestor'],
  '/cobros':           ['admin', 'gestor', 'cobrador'],
  '/inquilinos':       ['admin', 'gestor', 'legal'],
  '/tasas':            ['admin', 'gestor', 'legal'],
  '/legal':            ['admin', 'legal'],
};

// Items de sidebar visibles por rol
// Si la ruta no aparece aquí, la ven todos los autenticados
export const NAV_POR_ROL = {
  '/agenda':          ['admin', 'gestor', 'cobrador', 'legal'],
  '/agregar-cliente': ['admin', 'gestor'],
  '/inquilinos':      ['admin', 'gestor', 'legal'],
  '/cobros':          ['admin', 'gestor', 'cobrador'],
  '/historial-pagos': ['admin', 'gestor', 'cobrador'],
  '/tasas':           ['admin', 'gestor', 'legal'],
  '/historial':       ['admin', 'gestor'],
  '/dashboard':       ['admin', 'gestor'],
  '/usuarios':        ['admin'],
  '/legal':           ['admin', 'legal'],
};
