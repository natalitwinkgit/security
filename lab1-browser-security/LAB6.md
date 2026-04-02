# Lab 6: Session Lifecycle & The "Zombie" Session

## Task 1: Client-only logout

Start GoodHost in flawed logout mode:

```bash
cd goodhost-3000
npm run start:lab6-task1
```

Open:

- `http://localhost:3000`

Steps:

1. Log in as `john` or `alice`.
2. Copy the `SessionID` value from the browser storage panel.
3. Click `Logout`.
4. Send a manual request with the stolen cookie:

```bash
curl.exe -H "Cookie: SessionID=PASTE_SESSION_ID_HERE" http://localhost:3000/api/emails
```

Expected result:

- The UI looks logged out.
- The server still returns the protected email data.

Why it happens:

- The browser forgot the cookie locally.
- The server still keeps the session alive in its active session store.
- Anyone who already stole the token can still replay it.

## Task 2: Synchronized logout

Start GoodHost in synchronized logout mode:

```bash
cd goodhost-3000
npm run start:lab6-task2
```

Steps:

1. Log in and copy the `SessionID`.
2. Click `Logout`.
3. Repeat the manual request with the stolen cookie:

```bash
curl.exe -i -H "Cookie: SessionID=PASTE_SESSION_ID_HERE" http://localhost:3000/api/emails
```

Expected result:

- The server answers with `401 Unauthorized`.
- The session is truly dead because `/api/logout` removed it from the active session store.

## Task 3: Session expiry

Start GoodHost with a 2-minute TTL:

```bash
cd goodhost-3000
npm run start:lab6-task3
```

Steps:

1. Log in.
2. Wait 2 minutes.
3. Refresh the page.

Expected result:

- The UI returns to the login state.
- The server rejects the old session because it expired and was purged automatically.

## Notes

- Lab 6 uses a script-accessible cookie on `Path=/` because the logout flow in the task must clear the cookie through `document.cookie`.
- Lab 5 scripts are still available and unchanged for the `HttpOnly` and `Secure` demonstrations.
