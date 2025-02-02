import useAuth from "~/composables/auth";

export default defineEventHandler({
  onRequest: [cors({ origin: "client", credentials: true })],
  handler: (event) => {
    const auth = useAuth();

    return auth.handler(toWebRequest(event));
  },
});
