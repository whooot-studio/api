export default function useClient() {
  const config = useRuntimeConfig().client;

  const origin = `${config.protocol}://${config.host}${
    config.port ? ":" + config.port : ""
  }`;
  const ssrOrigin = `${config.ssrProtocol}://${config.ssrHost}${
    config.ssrPort ? ":" + config.ssrPort : ""
  }`;
  const domain = config.domain || config.host;

  return {
    origin,
    ssrOrigin,
    domain,
  };
}
