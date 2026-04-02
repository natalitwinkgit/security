# Lab 7: Cross-Site Request Forgery (CSRF)

## Task 1 and Task 2: Vulnerable delete action

Start GoodHost in the vulnerable mode:

```bash
cd goodhost-3000
npm run start:lab7-task1
```

Start WeatherApp:

```bash
cd ../weather-5000
npm start
```

Steps:

1. Open `http://localhost:3000` and log in as `john` or `alice`.
2. Confirm that the inbox shows `Delete` buttons.
3. Open `http://localhost:5000/weather-promo.html` in a new tab.
4. Refresh the Mail App.

Expected result:

- Email `#1` is deleted without the user clicking the delete button in GoodHost.
- The attack works because the browser automatically sends the valid session cookie with the hidden image request.

## Task 3: SameSite defense

### Lax

```bash
cd goodhost-3000
npm run start:lab7-task3:lax
```

### Strict

```bash
cd goodhost-3000
npm run start:lab7-task3:strict
```

Important:

- `localhost:5000` and `localhost:3000` are different origins but the same site, so they are not enough for a real SameSite demo.
- For the SameSite test, keep GoodHost on `http://localhost:3000` and open the malicious page from:
  `http://127.0.0.1.nip.io:5000/weather-promo.html`

Expected result:

- The request to `http://localhost:3000/api/emails/delete/1` is still attempted.
- The browser omits the `SessionID` cookie in this real cross-site context.
- The server rejects the deletion with `401 Unauthorized`.

Note:

- For an image-based CSRF attack like this one, both `SameSite=Lax` and `SameSite=Strict` block the cookie in a real cross-site context.
- `Strict` is still stricter in general because it also blocks more navigation cases.

## Task 4: POST and CSRF token hardening

Start GoodHost in the hardened mode:

```bash
cd goodhost-3000
npm run start:lab7-task4
```

WeatherApp can stay on:

```bash
cd ../weather-5000
npm start
```

Steps:

1. Open `http://localhost:3000` and log in.
2. Delete an email through the real UI to confirm that the button now uses `POST`.
3. Restart GoodHost if you want to restore the original inbox.
4. Open `http://localhost:5000/weather-promo.html`.

Expected result:

- The malicious hidden form can force a `POST` request.
- The request is rejected with `403 Forbidden`.
- The attacker cannot guess the secret `_csrf_token` that GoodHost stores in memory and sends only to its own UI.
