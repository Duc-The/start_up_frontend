import { z } from "zod"
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .max(255, "Email quá dài"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Mật khẩu không được vượt quá 72 byte"
    ),
  confirmPassword: z.string().optional(),
  displayName: z.string().max(255, "Tên quá dài").optional(),
})
export type AuthFields = z.infer<typeof authSchema>
export function schemaForMode(register: boolean) {
  return authSchema.superRefine((value, context) => {
    if (register) {
      if (value.password !== value.confirmPassword)
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Mật khẩu nhập lại chưa khớp",
        })
      if (!value.displayName?.trim())
        context.addIssue({
          code: "custom",
          path: ["displayName"],
          message: "Vui lòng nhập tên hiển thị",
        })
      if (value.password.length < 8)
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Mật khẩu phải có ít nhất 8 ký tự",
        })
    }
  })
}
