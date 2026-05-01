export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next({
        statusCode: 400,
        message: result.error.issues[0]?.message || "Validation failed"
      });
    }

    req.validatedBody = result.data;
    next();
  };
}
