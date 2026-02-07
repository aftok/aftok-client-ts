export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export function left<L, R>(value: L): Either<L, R> {
  return { type: "left", value };
}

export function right<L, R>(value: R): Either<L, R> {
  return { type: "right", value };
}

export function map<L, A, B>(
  e: Either<L, A>,
  f: (a: A) => B,
): Either<L, B> {
  return e.type === "left" ? e : right(f(e.value));
}

export function flatMap<L, A, B>(
  e: Either<L, A>,
  f: (a: A) => Either<L, B>,
): Either<L, B> {
  return e.type === "left" ? e : f(e.value);
}
