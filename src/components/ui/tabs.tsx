import React from 'react'

/**
 * Tabs simples: value = pestaña activa, onValueChange = cambia pestaña.
 * Pasamos 'current' a los hijos para evitar colisión con 'value'.
 */
export function Tabs({ value, onValueChange, children }: any) {
  return (
    <div>
      {React.Children.map(children, (c: any) =>
        React.cloneElement(c, { current: value, onValueChange })
      )}
    </div>
  )
}

export function TabsList({ children, className = '' }: any) {
  return (
    <div className={'flex gap-2 rounded-2xl bg-slate-100 p-1 ' + className}>
      {children}
    </div>
  )
}

export function TabsTrigger({
  value: val,
  children,
  current,
  onValueChange,
  className = '',
}: any) {
  const active = current === val
  return (
    <button
      onClick={() => onValueChange(val)}
      className={
        'flex-1 rounded-xl px-3 py-2 text-sm ' +
        (active ? 'bg-white shadow' : 'text-slate-600 hover:text-slate-900') +
        ' ' +
        className
      }
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value: val,
  current,
  children,
  className = '',
}: any) {
  return current === val ? <div className={className}>{children}</div> : null
}
