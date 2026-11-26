import type { Option } from "@/features/pois/types"
export function flatten(options: Option[]): Option[] {
  return options.flatMap((o) => [o, ...flatten(o.children || [])])
}
