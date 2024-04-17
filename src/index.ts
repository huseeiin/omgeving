type MakeValidatorOptions<T> = { devDefault?: T; default?: T };

type NumberOptions = MakeValidatorOptions<number>;
type StringOptions = MakeValidatorOptions<string>;
type URLOptions = MakeValidatorOptions<string | URL>;

type ValidatorOptions = NumberOptions | StringOptions | URLOptions;

const allowedTypes = ["number", "string", "url", "port"] as const;

interface Validator {
  name: (typeof allowedTypes)[number];
  options?: ValidatorOptions;
}

function error(msg: string) {
  console.log(`omgeving: \x1b[31m${msg}`);

  process.exit(1);
}

/**
 * Type-safe environment variables in Bun and Node. Inspired by [envalid](https://github.com/af/envalid).
 *
 * Example
 * ```ts
 * const { PORT } = cleanEnv({ PORT: port({ devDefault: 3000 }) });
 * ```
 */

export function cleanEnv<T extends { [key: string]: number | string }>(
  vars: T
) {
  const cleanedEnv: Record<string, string | number> = {};

  if (vars && Object.getPrototypeOf(vars) === Object.prototype) {
    const varsKv = Object.entries(vars);

    for (let index = 0; index < varsKv.length; index++) {
      const [key, value] = varsKv[index];

      const validator = value as unknown as Validator;

      if (!allowedTypes.includes(validator.name)) {
        error(`Unknown type \`${validator.name}\``);
      }

      const IS_DEV = process.env.NODE_ENV !== "production";

      const defaultEnvVar =
        validator.options?.default ?? (IS_DEV && validator.options?.devDefault);
      const envVar = process.env[key] ?? defaultEnvVar;

      if (
        envVar == null ||
        (defaultEnvVar &&
          ((validator.name === "port" && typeof defaultEnvVar !== "number") ||
            ((validator.name === "string" || validator.name === "number") &&
              typeof defaultEnvVar !== validator.name)))
      ) {
        error(`Expected \`${key}\` to be a ${validator.name}`);
      }

      function validateNumber() {
        cleanedEnv[key] = Number(envVar);

        if (Number.isNaN(cleanedEnv[key])) {
          error(`\`${key}\` is not a valid number`);
        }
      }

      if (typeof envVar === "string") {
        cleanedEnv[key] = envVar;
      }

      if (validator.name === "number") {
        validateNumber();
      }

      if (validator.name === "port") {
        validateNumber();

        // @ts-ignore
        if (cleanedEnv[key] < 0 || cleanedEnv[key] > 65536) {
          error(`\`${key}\` is not a valid port`);
        }
      }

      if (validator.name === "url") {
        if (typeof envVar === "string") {
          cleanedEnv[key] = new URL(envVar).href;
        } else if (envVar instanceof URL) {
          cleanedEnv[key] = envVar.href;
        }
      }
    }
  }

  return cleanedEnv as T;
}

export function number(options?: NumberOptions) {
  return { name: "number", options } as Validator as unknown as number;
}

export function string(options?: StringOptions) {
  return { name: "string", options } as Validator as unknown as string;
}

export function url(options?: URLOptions) {
  return { name: "url", options } as Validator as unknown as string;
}

export function port(options?: NumberOptions) {
  return { name: "port", options } as Validator as unknown as number;
}
