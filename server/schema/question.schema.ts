import { z } from "zod";

export const typeValidator = z
  .string({
    required_error: "Type is required",
  })
  .min(1, "Must not be empty")
  .max(32, "Must be at most 32 characters");

export const titleValidator = z
  .string({
    required_error: "Question is required",
  })
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const choiceValidator = z
  .string({
    required_error: "Choice is required",
  })
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters");

export const choicesValidator = z
  .array(choiceValidator)
  .nonempty("Must not be empty");

export const pointsValidator = z.preprocess(
  (v) => (v === 0 ? 0 : v || undefined),
  z
    .number({
      required_error: "Points is required",
    })
    .int("Must be an integer")
    .nonnegative("Must be a non-negative number")
);

export const answerValidator = z
  .string({
    required_error: "Answer is required",
  })
  .max(4096, "Must be at most 4096 characters");
export const answersValidator = answerValidator.or(
  z.array(answerValidator).nonempty("Must not be empty")
);

export const QuestionSchema = z.object({
  type: typeValidator,
  title: titleValidator,
  choices: choicesValidator,
  points: pointsValidator,
  answer: answersValidator,
});
export type QuestionSchema = z.infer<typeof QuestionSchema>;
