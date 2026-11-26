import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { managementApi } from "../api/managementApi"
import { contentTypes, base } from "../config/managementConfig"
import type { Row } from "../types"

export function useEditorMedia(
  section: string,
  record: Row,
  form: Record<string, unknown>
) {
  const supported = contentTypes.includes(section) || section === "businesses"
  const reference =
    section === "products"
      ? ["pois", form.manufacturerPoiId]
      : section === "certifications" && form.productId
        ? ["products", form.productId]
        : ["pois", form.poiId]
  const knownOwner =
    section === "businesses"
      ? record.id
      : String(record.businessId || form.businessId || "")
  const owner = useQuery({
    queryKey: ["management", "media-owner", reference[0], reference[1]],
    queryFn: () => managementApi<Row>(base + reference[0] + "/" + reference[1]),
    enabled: supported && !knownOwner && !!reference[1],
  })
  const businessId = knownOwner || String(owner.data?.businessId || "")
  const attached = useQuery({
    queryKey: ["management", "attached", section, record.id],
    queryFn: () =>
      managementApi<Row[]>(base + section + "/" + record.id + "/media"),
    enabled: supported && !!record.id,
  })
  const [selection, setSelection] = useState<{
    owner: string
    ids: string[]
  } | null>(null)
  const [uploaded, setUploaded] = useState<Row[]>([])
  const dirty = !!selection && selection.owner === businessId
  const ids = dirty ? selection.ids : (attached.data || []).map((a) => a.id)
  function change(ids: string[]) {
    setSelection({ owner: businessId, ids })
  }
  function add(asset: Row) {
    setUploaded((previous) => [...previous, asset])
    setSelection((previous) => ({
      owner: businessId,
      ids: [
        ...new Set([
          ...(previous?.owner === businessId
            ? previous.ids
            : (attached.data || []).map((a) => a.id)),
          asset.id,
        ]),
      ],
    }))
  }
  return {
    supported,
    businessId,
    ids,
    dirty,
    uploaded: uploaded.filter((a) => a.businessId === businessId),
    attached,
    owner,
    change,
    add,
    loading: supported && !!record.id && attached.isPending,
    error: supported && !!record.id ? attached.error : null,
  }
}
