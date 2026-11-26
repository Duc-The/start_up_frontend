import { beforeEach, describe, it, expect, vi } from "vitest"
import { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { httpClient, refreshClient } from "@/lib/axios"
import { api, ApiError, refreshSession } from "@/services/httpClient"
import {
  saveSession,
  clearSession,
  getAccessToken,
  savedSession,
} from "@/stores/authStore"
import { schemaForMode } from "@/features/auth/types/authSchema"
const auth = {
  user: {
    id: "test",
    userId: "USR-TEST",
    email: "test@example.com",
    displayName: "Test",
    status: "ACTIVE",
    roles: ["CUSTOMER"],
  },
  tokenType: "Bearer",
  accessToken: "old",
  refreshToken: "refresh-old",
  expiresIn: 900,
}
function success(config: InternalAxiosRequestConfig, data: unknown) {
  return {
    data: { status: 200, data },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  }
}
function unauthorized(config: InternalAxiosRequestConfig) {
  return Promise.reject(
    new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
      ...success(config, null),
      status: 401,
    })
  )
}
beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal("window", new EventTarget())
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
  clearSession()
  saveSession(auth)
})
describe("Axios session refresh", () => {
  it("shares one refresh for concurrent unauthorized requests", async () => {
    let refreshes = 0
    refreshClient.defaults.adapter = async (config) => {
      refreshes++
      await Promise.resolve()
      return success(config, {
        ...auth,
        accessToken: "new",
        refreshToken: "refresh-new",
      })
    }
    httpClient.defaults.adapter = (config) =>
      config.headers.get("Authorization") === "Bearer old"
        ? unauthorized(config)
        : Promise.resolve(success(config, "ok"))
    expect(
      await Promise.all([api("/protected/one"), api("/protected/two")])
    ).toEqual(["ok", "ok"])
    expect(refreshes).toBe(1)
    expect(getAccessToken()).toBe("new")
    expect(savedSession()?.refreshToken).toBe("refresh-new")
  })
  it("retries a request only once", async () => {
    let refreshes = 0
    refreshClient.defaults.adapter = async (config) => {
      refreshes++
      return success(config, {
        ...auth,
        accessToken: "new",
        refreshToken: "refresh-new",
      })
    }
    httpClient.defaults.adapter = unauthorized
    await expect(api("/protected/rejected")).rejects.toBeInstanceOf(ApiError)
    expect(refreshes).toBe(1)
  })
  it("does not restore a session cleared during refresh", async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    refreshClient.defaults.adapter = async (config) => {
      await gate
      return success(config, { ...auth, accessToken: "new" })
    }
    const pending = refreshSession()
    clearSession()
    release()
    await expect(pending).rejects.toMatchObject({ status: 401 })
    expect(getAccessToken()).toBeNull()
    expect(savedSession()).toBeNull()
  })
})
describe("Vietnamese form validation", () => {
  it("rejects invalid registration data", () => {
    const result = schemaForMode(true).safeParse({
      email: "bad",
      password: "short",
      displayName: " ",
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map((i) => i.path[0])).toEqual(
        expect.arrayContaining(["email", "password", "displayName"])
      )
  })
  it("allows login without requiring a display name", () => {
    expect(
      schemaForMode(false).safeParse({
        email: "test@example.com",
        password: "existing",
      }).success
    ).toBe(true)
  })
})

import { authDestination } from "@/features/auth/utils/authRedirect"
describe("Account page navigation", () => {
  it("routes each role to its workspace", () => {
    expect(authDestination(["ADMIN"])).toBe("/admin")
    expect(authDestination(["PARTNER"])).toBe("/partner")
    expect(authDestination(["CUSTOMER"])).toBe("/")
  })
  it("rejects external destinations and unauthorized admin routes", () => {
    expect(authDestination(["CUSTOMER"], "//external.example")).toBe("/")
    expect(authDestination(["PARTNER"], "/admin")).toBe("/partner")
    expect(authDestination(["CUSTOMER"], "/login")).toBe("/")
  })
  it("requires matching confirmation for registration", () => {
    const base = {
      email: "user@example.com",
      displayName: "Khách",
      password: "Ocop@123456",
    }
    expect(
      schemaForMode(true).safeParse({ ...base, confirmPassword: "wrong" })
        .success
    ).toBe(false)
    expect(
      schemaForMode(true).safeParse({ ...base, confirmPassword: base.password })
        .success
    ).toBe(true)
  })
})
