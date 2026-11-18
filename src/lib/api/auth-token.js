let provider = null;

export function setTokenProvider(value) {
  provider = value;
}
export async function getAccessToken(refresh = false) {
  return provider ? provider(refresh) : null;
}
