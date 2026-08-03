/**
 * Temas visuales por módulo (inicio).
 * Clases Tailwind completas y estáticas para que el purge/JIT las detecte.
 * primary-dark (#0D2438) no es marca: se reserva como superficie de contraste.
 */

export const GREETING_THEME = {
  online: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  offline: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
};

export const MODULE_THEMES = {
  ventas: {
    cardBorder: 'border-transparent hover:border-emerald-200',
    cardBorderOffline: 'border-orange-300',
    header: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
    headerOffline: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white',
    link: 'hover:bg-emerald-50 active:bg-emerald-100 transition-colors group',
    linkOffline: 'hover:bg-orange-50 active:bg-orange-100 transition-colors group',
    linkText: 'group-hover:text-emerald-700',
    linkTextOffline: 'group-hover:text-orange-700',
    icon: 'group-hover:text-emerald-600',
    iconOffline: 'group-hover:text-orange-600',
  },
  inventario: {
    cardBorder: 'border-transparent hover:border-blue-200',
    header: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    link: 'hover:bg-blue-50 active:bg-blue-100 transition-colors group',
    linkText: 'group-hover:text-blue-700',
    icon: 'group-hover:text-blue-600',
  },
  finanzas: {
    cardBorder: 'border-transparent hover:border-teal-200',
    header: 'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
    link: 'hover:bg-teal-50 active:bg-teal-100 transition-colors group',
    linkText: 'group-hover:text-teal-700',
    icon: 'group-hover:text-teal-600',
  },
  edicion: {
    cardBorder: 'border-transparent hover:border-purple-200',
    header: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
    link: 'hover:bg-purple-50 active:bg-purple-100 transition-colors group',
    linkText: 'group-hover:text-purple-700',
    icon: 'group-hover:text-purple-600',
  },
  compras: {
    cardBorder: 'border-transparent hover:border-amber-200',
    header: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
    link: 'hover:bg-amber-50 active:bg-amber-100 transition-colors group',
    linkText: 'group-hover:text-amber-700',
    icon: 'group-hover:text-amber-600',
  },
};
