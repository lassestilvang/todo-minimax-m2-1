import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false)

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    // Setting initial value synchronously is necessary for SSR/hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}
