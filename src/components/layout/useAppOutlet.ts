import { useOutletContext } from 'react-router-dom'
import type { AppOutlet } from './AppShell'

export function useAppOutlet() {
  return useOutletContext<AppOutlet>()
}
