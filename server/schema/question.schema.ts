import { z } from "zod";

export const typeValidator = z
  .string({
    required_error: "Type is required",
  })
  .min(1, "Must not be empty")
  .max(32, "Must be at most 32 characters");

export const titleValidator = z
  .string({
    required_error: "Title is required",
  })
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const choiceValidator = z
  .string({
    required_error: "Choice is required",
  })
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const choicesValidator = z.array(choiceValidator);

export const pointsValidator = z
  .number({
    required_error: "Points is required",
  })
  .int("Must be an integer")
  .min(0, "Must be a positive number");

export const answerValidator = z
  .string({
    required_error: "Answer is required",
  })
  .max(4096, "Must be at most 4096 characters");
export const answersValidator = answerValidator.or(z.array(answerValidator));

export const QuestionCreateSchema = z.object({
  type: typeValidator,
  title: titleValidator,
  choices: choicesValidator,
  points: pointsValidator.optional(),
  answer: answersValidator,
});
export type QuestionCreateSchema = z.infer<typeof QuestionCreateSchema>;
