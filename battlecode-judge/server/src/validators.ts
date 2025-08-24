import { body } from "express-validator";

export const submitValidator = [
  body("problemId").isString().notEmpty(),
  body("language").isIn(["python", "cpp", "node", "java"]),
  body("code").isString().isLength({ min: 1 })
];
