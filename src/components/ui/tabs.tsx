import React from 'react'

/** Contenedor: inyecta {current, onValueChange} a TODOS los hijos directos */
export function Tabs({ value, onValueChange, children }: any) {
  return (
    <div>
      {React.Children.map(children, (c: any) =>
        React.cloneElement(c, { current: value, onValueChange })
      )}
    </div>
  )
}

/** La lista ahora PROPAGA también a sus propios hijos (los Triggers) */
export function TabsList({
  children,
  className = '',
  current,
  onValueChange,
}: any) {
  return (
    <div className={'flex gap-2 rounded-2xl bg-slate-100 p-1 ' + className}>
      {React.Children.map(children, (c: any) =>
        React.cloneElement(c, { current, onValueChange })
      )}
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
      onClick={() => onValueChange && onValueChange(val)}
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
