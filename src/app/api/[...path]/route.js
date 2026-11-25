const forwardedHeaders = ['accept', 'accept-language', 'authorization', 'content-type'];

async function proxy(request) {
  const { pathname, search } = new URL(request.url);
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const headers = new Headers();
  for (const name of forwardedHeaders) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  try {
    const upstream = await fetch(backendUrl + pathname + search, {
      method: request.method,
      headers,
      body: request.body,
      duplex: 'half',
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ detail: 'Unable to connect to the backend.' }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE, proxy as PATCH };
