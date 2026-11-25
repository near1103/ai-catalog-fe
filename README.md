# AI Catalog Frontend

A web interface for browsing products and categories. Admins can add products, upload photos, and assign categories manually or with AI suggestions.

The frontend uses Next.js, connects to a Spring Boot API, and uses Firebase Authentication for admin sign-in.

## Run locally

1. Install dependencies with `npm ci`.
2. Start the Spring Boot API. Next.js forwards `/api/*` to `http://localhost:8080` by default.
3. Copy `.env.local.example` to `.env.local`, or use your existing `.env` if it is already configured. Set `BACKEND_URL` if your API runs at a different address. This replaces `NEXT_PUBLIC_API_URL`.
4. Run `npm run dev` and open the [catalog](http://localhost:3000/catalog).

## Share via ngrok

1. Keep Spring Boot running locally. Start Next.js with `npm run build` followed by `npm start` after saving any configuration changes.
2. Run `ngrok http 3000` and open the generated HTTPS URL. The same tunnel serves the pages and `/api/*`. Next.js makes the requests to Spring Boot locally, so the ngrok origin needs no Spring CORS entry.
3. For Google sign-in, add the ngrok hostname to Firebase Authentication's authorized domains.
4. If Spring Boot uses local media storage, set `APP_STORAGE_LOCAL_BASE_URL` to the public HTTPS URL with `/media` appended. Next.js forwards `/media/*` to Spring Boot. Update any previously saved URLs that point to `localhost` if those images need to be visible through the tunnel.

## Admin sign-in

1. In the Firebase project settings, find your web app configuration. Copy `apiKey`, `authDomain`, `projectId`, and `appId` into the matching `NEXT_PUBLIC_FIREBASE_*` variables.
2. In Firebase Authentication, enable Email/Password or Google sign-in. For Google sign-in, add `localhost` to the authorized domains if needed.
3. Grant your user the `admin: true` claim using `AdminClaimsCommand` as described in the backend README.
4. Restart the frontend after changing environment settings, then open the [admin sign-in page](http://localhost:3000/admin/login).

## Checks

```sh
npm run format:check
node --test tests/*.test.mjs
npm run build
```
