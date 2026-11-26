import { describe, it, expect } from "vitest"
import { normalizeCatalogCode } from "@/utils/catalogCode"
describe("Catalog code input", () => {
  it("preserves valid area codes and removes pasted invisible whitespace", () => {
    for (const value of [
      "HAI_CHAU",
      " hai_chau ",
      "\u00a0HAI_CHAU\u00a0",
      "HAI_\u200bCHAU\ufeff",
      "ＨＡＩ＿ＣＨＡＵ",
    ])
      expect(normalizeCatalogCode(value)).toBe("HAI_CHAU")
  })
  it("does not hide meaningful invalid characters", () => {
    expect(normalizeCatalogCode("HAI CHAU")).toBe("HAI CHAU")
    expect(normalizeCatalogCode("HAI-CHAU")).toBe("HAI-CHAU")
  })
})
