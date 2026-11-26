import { Navigate, useLocation } from "react-router-dom"
export default function AuthDialog(_props: { onClose: () => void }) {
  void _props
  const location = useLocation()
  return (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
    />
  )
}
