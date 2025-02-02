export default function useClient() {
  const config = useRuntimeConfig().client;
  const origin = `${config.protocol}://${config.host}:${config.port}`;

  return {
    origin,
  };
}
