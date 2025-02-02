import { defu } from "defu";
import { H3Event } from "h3";
import useAuth from "~/composables/auth";

type AuthorizationOptions = {
  user?: "allow" | "deny";
  guest?: "allow" | "deny";
};

export function authorization(options?: AuthorizationOptions) {
  return async (event: H3Event) => {
    const _options = defu(options, { user: "deny", guest: "deny" });

    const auth = useAuth();
    const session = await auth.api.getSession({
      headers: event.headers,
    });

    if (_options.guest === "deny" && !session)
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

    if (_options.user === "deny" && session)
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });

    event.context.session = session;
  };
}
