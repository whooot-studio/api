import { defu } from "defu";
import { H3CorsOptions } from "h3";
import useClient from "~/composables/client";

type CorsOptions = (Omit<H3CorsOptions, "origin"> & {
  origin?: H3CorsOptions["origin"] | "client";
}) & {
  onHandled?: (event) => void;
  onUnhandled?: (event) => void;
};

export function cors(options?: CorsOptions) {
  return (event) => {
    const _options = defu(options || {}, {
      origin: "client",
      preflight: { statusCode: 204 },
    });

    if (_options.origin === "client") {
      const config = useClient();
      _options.origin = config.origin;
    }

    const handled = handleCors(event, _options as H3CorsOptions);
    if (handled && options?.onHandled) options.onHandled(event);
    else if (!handled && options?.onUnhandled) options.onUnhandled(event);
  };
}
