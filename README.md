# IAM SAML Cookie Fix

## What this does

Luxembourg’s school IAM uses SAML cookies with a short timeout  
(around one hour).

This Firefox extension extends the lifetime of specific SAML cookies so
users stay logged in longer.

It works fully locally.  
No servers.  
No tracking.

---

## How it works

The extension listens for cookie changes in the browser.

When a matching SAML cookie is updated, the extension:
- keeps the existing cookie value
- rewrites the expiration date
- extends it to **7 days**

Only the expiration time is modified.

---

## Cookies affected

The extension currently targets:

- `SAMLAuthToken`
- `SAML`

All other cookies are ignored.

---

## Technical details

- Firefox extension (Manifest V2)
- Uses the cookies API
- Background script only
- No content scripts
- No network requests

---

## Privacy

This extension:
- does not collect personal data
- does not transmit data
- does not store data outside the browser

Cookie access is local and only used to extend expiration times.

---

## Disclaimer

This extension is a workaround for IAM session limitations.  
Use it only where allowed by your organisation’s IT policies.
