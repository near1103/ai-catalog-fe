# AI Catalog Frontend

A web interface for browsing products and categories. Admins can add products, upload photos, and assign categories manually or with AI suggestions.

The frontend uses Next.js, connects to a Spring Boot API, and uses Firebase Authentication for admin sign-in.

## Run locally

1. Install dependencies with `npm ci`.
2. Start the Spring Boot API. The frontend expects it at `http://localhost:8080` by default. Set `APP_CORS_ALLOWED_ORIGINS=http://localhost:3000` in the backend configuration.
3. Copy `.env.local.example` to `.env.local`, or use your existing `.env` if it is already configured. Set `NEXT_PUBLIC_API_URL` if your API runs at a different address.
4. Run `npm run dev` and open the [catalog](http://localhost:3000/catalog).

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
