export function params(values: Record<string, unknown>) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (!Array.isArray(value) || value.length)
    )
      query.set(key, Array.isArray(value) ? value.join(",") : String(value))
  })
  return query.toString()
}
