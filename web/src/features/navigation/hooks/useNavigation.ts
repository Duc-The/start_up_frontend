import { useEffect, useState, useSyncExternalStore } from "react"
import { directionsApi } from "@/features/directions/api/directionsApi"
import { NavigationSession } from "../services/NavigationSession"
export function useNavigation() {
  const [session] = useState(
    () => new NavigationSession(() => navigator.geolocation, directionsApi)
  )
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot)
  useEffect(() => () => session.dispose(), [session])
  return {
    state,
    start: session.start,
    startFromGps: session.startFromGps,
    stop: session.stop,
  }
}
