# Shop Frontend

JavaScript / Next.js App Router / Tailwind CSS / TanStack Query / React Hook Form / Zod.
Spring Boot is the only catalog API. Backend sources were used to confirm the contract; backend files were not changed.

## Local setup

1. Run `npm install`.
2. Copy `.env.local.example` to `.env.local` and fill in the Firebase **Web App** configuration:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Existing `.env` remains untouched. `.env.local` overrides it. Restart Next.js after changes; public configuration is embedded at build time for production.

3. Firebase Console → Project settings → General → Your apps → add/select a Web App → SDK setup and configuration → Config. Copy `apiKey`, `authDomain`, `projectId`, `appId` into the corresponding variables. These are Web configuration values; no service account, private key, Gemini key or Cloudinary secret belongs here.
4. Authentication → Sign-in method: enable Email/Password and Google. For Google select a support email. Under Authentication settings → Authorized domains, add your frontend domain and `localhost` if absent.
5. Use a Firebase user with the backend-managed boolean custom claim `admin: true`. Follow the backend README's AdminClaimsCommand instructions to assign it. Sign in again after assigning the claim.
6. Backend must be running. Set backend `APP_CORS_ALLOWED_ORIGINS=http://localhost:3000` (and the deployment origin when deploying). Keep the existing backend API/configuration otherwise.
7. Run `npm run dev`, open http://localhost:3000.

## Sign in and authorization

Open `/admin/login`. Enter the email and password of an existing Firebase Authentication user, or choose **Продовжити з Google** and finish the popup. This UI does not create accounts or assign permissions.

Firebase SDK manages persistence. `onIdTokenChanged` tracks the user; admin requests call `currentUser.getIdToken()` and send `Authorization: Bearer <ID token>`. A 401 triggers one retry with `getIdToken(true)`; a second 401 redirects to login. A 403 shows that the account lacks ADMIN access. Login alone grants no admin authority: every protected operation is checked by Spring Boot. Tokens are not manually written to localStorage. Admin query data is removed when the user changes, and all query data is cleared on logout.

## Pages

Public: `/`, `/catalog`, `/categories`, `/categories/[id]`, `/products/[id]`.

Admin: `/admin` redirects to `/admin/products`; `/admin/login`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`.

Public and admin have separate navigation/layouts. The UI includes loading, empty, error and responsive states. There is no search, pricing, cart, checkout, ratings or reviews.

## Contract and behavior

- List responses are arrays, not paginated envelopes. Public API returns only ACTIVE products. The backend has no category-filter parameter: the frontend filters the already fetched public list by category ancestry.
- Categories use `PUT /api/admin/categories/{id}` to create/update; creation requires an explicit unique ID. Root, section and leaf levels are 1, 2 and 3. Existing parent/level are immutable. Backend handles deletion constraints.
- Category creation offers separate level, department, and group selectors, plus an Add action beside each eligible parent in the tree. IDs are generated from the name with collision suffixes and can be customized. Saving retains the parent selection for consecutive additions; editing shows the fixed category location.
- Category images are selected or dropped in the category form, previewed locally, and uploaded on Save via `POST /api/admin/categories/{id}/image` (multipart field `file`). New categories are saved before uploading; a failed upload retains the file and the saved category for retry. Clearing an image saves `imageUrl: null`. Category search matches names, IDs, and paths while retaining ancestor context.
- Product create/update submits only `name`, `description`, `characteristics`. Characteristics are editable key/value rows, validated for nonempty unique keys and serialized as a map.
- Editing name/description/characteristics refetches the product. Suggestion invalidation belongs to the backend.
- Save the product before category suggestions and publishing: actions use saved backend data. Unsaved form edits are preserved while independent actions refresh product state.
- Images upload as `FormData` with field `file` to `POST /api/admin/products/{id}/images`. The browser sets the multipart boundary. A spinner/text pending state disables repeated uploads. Primary/delete use the current array index; product data is refetched after mutations, including failures that may have changed backend status. The frontend never uploads directly to Cloudinary.
- Saved products of any status support manually triggered AI suggestions. Categorization uses three dependent dropdowns (department, group, category); changing a parent clears its descendants. Existing assignments populate all three lists. AI recommendations populate the same lists and require explicit acceptance; changing the selection applies a manual category instead. Accept/dismiss call backend action endpoints. Manual selection remains available if generation fails.
- Publish/deactivate/delete use backend endpoints. Publication validation and image rules remain on the backend; ProblemDetail messages are shown in the UI. Deletions require a UI confirmation.
- API client parses JSON including `application/problem+json`, handles 204, 401/403/404 and network errors, and preserves backend error details.

## Checks

Code formatting uses Prettier with two-space indentation, single quotes, and a 100-character print width. Run `npm run format` to format the project or `npm run format:check` to check it without changing files.

```sh
npm run format:check
node --test tests/*.test.mjs
npm run build
```

Thirteen tests cover the API client and category selection: token refresh, retry limits, 403, ProblemDetail, multipart headers, public requests, network errors, 404, and validation of complete three-level category paths. No lint script is present. No TypeScript source was added (Next.js may print a built-in TypeScript check stage).

Added dependency: `firebase` (Web SDK; imports only app/auth). The existing frontend stack is retained. `npm audit` currently reports four high findings through Firebase's transitive Firestore/gRPC packages. This app does not import Firestore. No forced downgrade or unrelated dependency override was applied.

Live Firebase login, backend CRUD, Cloudinary uploads and Gemini generation still require a configured Firebase Web App and running backend and must be verified in that environment. Browser-session inspection was blocked by automatic permission review, so interactive browser validation was not completed.
