# Lab 5: Network Security & Man-in-the-Middle

## Task 1: HttpOnly is not enough

Start GoodHost in HttpOnly-only mode:

```bash
cd goodhost-3000
npm run start:lab5-task1
```

Start the proxy in normal mode:

```bash
cd ../proxy-8080
npm start
```

Open:

- `http://localhost:8080`

Log in as `john` or `alice`.

Switch the proxy to breach mode:

```bash
npm run start:breach
```

Refresh the page and inspect the proxy terminal. You should see lines like:

```text
[Proxy][Breach] GET /api/me Cookie: SessionID=...
```

Why this happens:

- `HttpOnly` blocks JavaScript access to `document.cookie`.
- It does not hide the `Cookie` header from a network attacker.
- The proxy sits on the network path and reads raw HTTP headers before they reach the destination server.

## Task 2: Hardening with Secure

Start GoodHost in Secure-cookie mode:

```bash
cd ../goodhost-3000
npm run start:lab5-task2
```

Start the proxy in breach mode:

```bash
cd ../proxy-8080
npm run start:breach
```

Open:

- `http://localhost:8080`

If your browser treats `localhost` as a secure exception, use:

- `http://127.0.0.1.nip.io:8080`

Log in and refresh the page.

Expected result:

- `Set-Cookie` contains `HttpOnly; Secure`.
- The browser does not send `SessionID` over plain HTTP.
- Proxy logs for `/api/me` and `/api/emails` show `Cookie: (none)`.

Conclusion:

- `Secure` forces the browser to send the session cookie only over HTTPS.
- This protects the cookie from plain-text interception by a malicious HTTP proxy.
