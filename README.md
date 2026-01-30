# IAM SAML Cookie Fix

A browser extension that fixes short-lived SAML authentication cookies by allowing users to override cookie expiration times for specific domains.

## Description

This extension intercepts HTTP responses containing `Set-Cookie` headers and modifies the cookie expiration to a user-defined duration for configured domains. This is particularly useful for SAML-based authentication systems where session cookies expire too quickly, causing frequent logins.

## Features

- **Domain-specific overrides**: Set custom cookie durations for specific domains or use wildcards (e.g., `*.example.com`).
- **Flexible duration settings**: Configure expiration in days, hours, minutes, and seconds.
- **Per-cookie control**: Enable/disable overrides for individual cookies within a domain.
- **Logging**: View the last 25 cookie overrides with timestamps and duration changes.
- **Cross-browser support**: Works on Chrome and Firefox.
## Usage

1. Click the extension icon in your browser toolbar to open the popup.
2. Click "Add domain" to add a new domain rule.
3. Enter the domain (e.g., `example.com`) or a wildcard pattern (e.g., `*.example.com`).
4. Set the desired cookie duration using the days, hours, minutes, and seconds inputs (default is 7 days).
5. Check/uncheck the box to enable/disable the rule.
6. The extension will automatically override cookies for matching domains when they have a shorter expiration than your configured duration.
7. View recent overrides in the "Last 25 Overrides" section.

## How It Works

The extension uses the `webRequest` API to intercept all HTTP responses. For each `Set-Cookie` header:

1. It parses the cookie name, value, and attributes.
2. Determines the cookie's domain (from the header or the request URL).
3. Checks if there's a matching rule for the domain.
4. If the current `Max-Age` or `Expires` is less than the configured duration, it replaces it with the new duration.
5. Logs the override for review.

## Permissions

- **cookies**: Required to modify cookie settings.
- **storage**: Used to store domain rules and logs locally.
- **webRequest** and **webRequestBlocking**: Needed to intercept and modify HTTP responses.
- **<all_urls>**: Allows the extension to work on any website.

## Browser Support

- Firefox (with Gecko ID: `saml-cookies@kbra.lu`)

## Contributing

Feel free to submit issues or pull requests for improvements.

## License

This project is provided as-is without any warranty. Use at your own risk.

