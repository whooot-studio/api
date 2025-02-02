import { H3CorsOptions } from "h3";
import { defu } from "defu";

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
      const config = useRuntimeConfig(event).client;
      _options.origin = `${config.protocol}://${config.host}:${config.port}`;
    }

    const handled = handleCors(event, _options as H3CorsOptions);
    if (handled && options?.onHandled) options.onHandled(event);
    else if (!handled && options?.onUnhandled) options.onUnhandled(event);
  };
}
