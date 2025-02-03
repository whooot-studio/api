import { z } from "zod";

export const emailValidator = z
  .string({
    required_error: "Email is required",
  })
  .email("Invalid email")
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const passwordValidator = z
  .string({
    required_error: "Password is required",
  })
  .min(8, "Must be at least 8 characters")
  .max(128, "Must be at most 128 characters")
  .regex(/.*[0-9].*/, "Must contain at least one number")
  .regex(/.*[A-Z].*/, "Must contain at least one uppercase letter")
  .regex(/.*[a-z].*/, "Must contain at least one lowercase letter")
  .regex(/.*[^\s].*/, "Must not contain spaces")
  .regex(/.*[^A-Za-z0-9].*/, "Must contain at least one special character");

export const usernameValidator = z
  .string({
    required_error: "Username is required",
  })
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const LoginSchema = z.object({
  email: emailValidator,
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(1, "Must not be empty"),
  rememberMe: z.boolean(),
});
export type LoginSchema = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: emailValidator,
  username: usernameValidator,
  password: passwordValidator,
});
export type RegisterSchema = z.infer<typeof RegisterSchema>;
