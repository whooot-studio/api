export default function useClient() {
  const config = useRuntimeConfig().client;
  const origin = `${config.protocol}://${config.host}${
    config.port ? ":" + config.port : ""
  }`;
  const domain = config.domain || config.host;

  return {
    origin,
    domain,
  };
}
