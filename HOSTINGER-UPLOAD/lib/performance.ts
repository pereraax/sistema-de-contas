// Utilitário para medir performance
export function measurePerformance(name: string, fn: () => Promise<any> | any) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const start = performance.now()
    const result = fn()
    if (result instanceof Promise) {
      return result.then((data) => {
        const end = performance.now()
        console.log(`⏱️ [Performance] ${name}: ${(end - start).toFixed(2)}ms`)
        return data
      })
    } else {
      const end = performance.now()
      console.log(`⏱️ [Performance] ${name}: ${(end - start).toFixed(2)}ms`)
      return result
    }
  }
  return fn()
}





