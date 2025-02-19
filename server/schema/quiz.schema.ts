import { z } from "zod";

export const titleValidator = z
  .string({
    required_error: "Title is required",
  })
  .trim()
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const descriptionValidator = z
  .string({
    required_error: "Description is required",
  })
  .trim()
  .min(1, "Must not be empty")
  .max(1023, "Must be at most 1023 characters");

export const imageValidator = z
  .string({
    required_error: "Image is required",
  })
  .trim()
  .min(1, "Must not be empty")
  .url("Must be a valid URL")
  .max(255, "Must be at most 255 characters");

export const QuizSchema = z.object({
  title: titleValidator,
  description: descriptionValidator.or(z.literal("")).optional(),
  image: imageValidator.or(z.literal("")).optional(),
});
export type QuizSchema = z.infer<typeof QuizSchema>;
