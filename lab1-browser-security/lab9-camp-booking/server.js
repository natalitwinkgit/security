const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function readArg(prefix, fallback) {
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

const port = Number.parseInt(readArg("--port=", "9000"), 10);
const uiValidationMode = readArg("--ui-validation=", "off");
const serverValidationMode = readArg("--server-validation=", "off");
const validModes = new Set(["off", "on"]);
const bookings = [];

if (!Number.isFinite(port) || port <= 0) {
  console.error(`[Server] Unsupported port "${port}". Use a positive integer.`);
  process.exit(1);
}

if (!validModes.has(uiValidationMode)) {
  console.error(`[UI] Unsupported validation mode "${uiValidationMode}". Use "off" or "on".`);
  process.exit(1);
}

if (!validModes.has(serverValidationMode)) {
  console.error(
    `[Server] Unsupported validation mode "${serverValidationMode}". Use "off" or "on".`
  );
  process.exit(1);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getFormValues(source = {}) {
  return {
    name: String(source.name || ""),
    surname: String(source.surname || ""),
    email: String(source.email || ""),
    age: String(source.age || ""),
    bookingDate: String(source.bookingDate || ""),
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidAge(ageValue) {
  if (!/^-?\d+$/.test(ageValue)) {
    return false;
  }

  const age = Number.parseInt(ageValue, 10);
  return age >= 5 && age <= 100;
}

function isValidBookingDate(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return false;
  }

  const [yearText, monthText, dayText] = dateValue.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function validateBooking(values) {
  const normalized = {
    name: normalizeText(values.name),
    surname: normalizeText(values.surname),
    email: normalizeText(values.email),
    age: normalizeText(values.age),
    bookingDate: normalizeText(values.bookingDate),
  };
  const errors = [];

  if (!normalized.name) {
    errors.push("Name is required.");
  }

  if (!normalized.surname) {
    errors.push("Surname is required.");
  }

  if (!normalized.email) {
    errors.push("Email is required.");
  } else if (!isValidEmail(normalized.email)) {
    errors.push("Email format is invalid.");
  }

  if (!normalized.age) {
    errors.push("Age is required.");
  } else if (!isValidAge(normalized.age)) {
    errors.push("Age must be a whole number between 5 and 100.");
  }

  if (!normalized.bookingDate) {
    errors.push("Date of booking is required.");
  } else if (!isValidBookingDate(normalized.bookingDate)) {
    errors.push("Date of booking must be a real date in YYYY-MM-DD format.");
  }

  return {
    normalized,
    errors,
  };
}

function renderBookingsList(escapeOutput) {
  if (bookings.length === 0) {
    return "<p>No bookings stored yet.</p>";
  }

  const items = bookings
    .map((booking, index) => {
      const renderValue = (value) =>
        escapeOutput ? escapeHtml(value) : String(value);

      return [
        "<li>",
        `<strong>#${index + 1}</strong>`,
        `<div>Name: ${renderValue(booking.name)}</div>`,
        `<div>Surname: ${renderValue(booking.surname)}</div>`,
        `<div>Email: ${renderValue(booking.email)}</div>`,
        `<div>Age: ${renderValue(booking.age)}</div>`,
        `<div>Date of Booking: ${renderValue(booking.bookingDate)}</div>`,
        "</li>",
      ].join("");
    })
    .join("");

  return `<ol>${items}</ol>`;
}

function renderPage({
  values = {},
  confirmation = null,
  errorMessage = null,
  statusCode = 200,
}) {
  const safeValues = getFormValues(values);
  const uiValidationEnabled = uiValidationMode === "on";
  const serverValidationEnabled = serverValidationMode === "on";
  const escapeOutput = serverValidationEnabled;
  const renderValue = (value) => (escapeOutput ? escapeHtml(value) : String(value));
  const nameAttributes = uiValidationEnabled ? 'required autocomplete="given-name"' : "";
  const surnameAttributes = uiValidationEnabled ? 'required autocomplete="family-name"' : "";
  const emailType = uiValidationEnabled ? "email" : "text";
  const emailAttributes = uiValidationEnabled ? 'required autocomplete="email"' : "";
  const ageType = uiValidationEnabled ? "number" : "text";
  const ageAttributes = uiValidationEnabled ? 'required min="5" max="100" step="1"' : "";
  const bookingDateType = uiValidationEnabled ? "date" : "text";
  const bookingDateAttributes = uiValidationEnabled ? "required" : "";
  const confirmationBlock = confirmation
    ? [
        '<section class="panel success">',
        "<h2>Booking received</h2>",
        "<p>The server stored the following values:</p>",
        "<dl>",
        `<dt>Name</dt><dd>${renderValue(confirmation.name)}</dd>`,
        `<dt>Surname</dt><dd>${renderValue(confirmation.surname)}</dd>`,
        `<dt>Email</dt><dd>${renderValue(confirmation.email)}</dd>`,
        `<dt>Age</dt><dd>${renderValue(confirmation.age)}</dd>`,
        `<dt>Date of Booking</dt><dd>${renderValue(confirmation.bookingDate)}</dd>`,
        "</dl>",
        "</section>",
      ].join("")
    : "";
  const errorBlock = errorMessage
    ? [
        '<section class="panel error">',
        "<h2>Request rejected</h2>",
        `<p>${escapeHtml(errorMessage)}</p>`,
        "</section>",
      ].join("")
    : "";

  return {
    statusCode,
    html: [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '  <meta charset="utf-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
      "  <title>Camp Booking Validator</title>",
      "  <style>",
      "    body { font-family: Arial, sans-serif; background: #f4f1e8; color: #1f2a1f; margin: 0; }",
      "    main { max-width: 860px; margin: 40px auto; padding: 24px; }",
      "    h1, h2 { margin-top: 0; }",
      "    .layout { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }",
      "    .panel { background: #fffdf7; border: 1px solid #d8cfbf; border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(75, 66, 49, 0.08); }",
      "    .error { border-color: #c85c5c; background: #fff2f2; }",
      "    .success { border-color: #5e8c61; background: #f2fff2; }",
      "    label { display: block; font-weight: 700; margin-bottom: 6px; }",
      "    input { width: 100%; box-sizing: border-box; padding: 10px 12px; margin-bottom: 14px; border: 1px solid #bdb2a0; border-radius: 8px; }",
      "    button { background: #2e5a3f; color: white; border: 0; border-radius: 999px; padding: 12px 18px; cursor: pointer; }",
      "    dl { display: grid; grid-template-columns: 150px 1fr; gap: 10px 12px; margin: 0; }",
      "    dt { font-weight: 700; }",
      "    dd { margin: 0; }",
      "    ol { padding-left: 22px; }",
      "    li + li { margin-top: 14px; }",
      "    .meta { color: #665b4b; font-size: 14px; }",
      "  </style>",
      "</head>",
      "<body>",
      "  <main>",
      "    <h1>Camp Booking Validator</h1>",
      `    <p class="meta">UI validation: ${escapeHtml(uiValidationMode)} | Server validation: ${escapeHtml(serverValidationMode)} | Stored bookings: ${bookings.length}</p>`,
      '    <div class="layout">',
      '      <section class="panel">',
      "        <h2>Booking form</h2>",
      '        <form method="post" action="/bookings">',
      '          <label for="name">Name</label>',
      `          <input id="name" name="name" type="text" value="${escapeHtml(safeValues.name)}" ${nameAttributes} />`,
      '          <label for="surname">Surname</label>',
      `          <input id="surname" name="surname" type="text" value="${escapeHtml(
        safeValues.surname
      )}" ${surnameAttributes} />`,
      '          <label for="email">Email</label>',
      `          <input id="email" name="email" type="${emailType}" value="${escapeHtml(
        safeValues.email
      )}" ${emailAttributes} />`,
      '          <label for="age">Age</label>',
      `          <input id="age" name="age" type="${ageType}" value="${escapeHtml(
        safeValues.age
      )}" ${ageAttributes} />`,
      '          <label for="bookingDate">Date of Booking</label>',
      `          <input id="bookingDate" name="bookingDate" type="${bookingDateType}" value="${escapeHtml(
        safeValues.bookingDate
      )}" ${bookingDateAttributes} />`,
      '          <button type="submit">Submit booking</button>',
      "        </form>",
      "      </section>",
      '      <section class="panel">',
      "        <h2>Stored bookings</h2>",
      `        ${renderBookingsList(escapeOutput)}`,
      "      </section>",
      "    </div>",
      `    ${errorBlock}`,
      `    ${confirmationBlock}`,
      "  </main>",
      "</body>",
      "</html>",
    ].join("\n"),
  };
}

app.get("/", (req, res) => {
  const page = renderPage({});
  res.status(page.statusCode).type("html").send(page.html);
});

app.post("/bookings", (req, res) => {
  const incomingValues = getFormValues(req.body);
  console.log("[Booking] Received:", incomingValues);

  if (serverValidationMode === "on") {
    const { normalized, errors } = validateBooking(incomingValues);

    if (errors.length > 0) {
      const page = renderPage({
        values: incomingValues,
        errorMessage: errors.join(" "),
        statusCode: 400,
      });
      return res.status(page.statusCode).type("html").send(page.html);
    }

    bookings.push(normalized);
    const page = renderPage({
      values: normalized,
      confirmation: normalized,
      statusCode: 200,
    });
    return res.status(page.statusCode).type("html").send(page.html);
  }

  bookings.push(incomingValues);
  const page = renderPage({
    values: incomingValues,
    confirmation: incomingValues,
    statusCode: 200,
  });
  return res.status(page.statusCode).type("html").send(page.html);
});

app.listen(port, () => {
  console.log(`Camp Booking Validator running on http://localhost:${port}`);
  console.log(`[UI] Validation: ${uiValidationMode}`);
  console.log(`[Server] Validation: ${serverValidationMode}`);
});
