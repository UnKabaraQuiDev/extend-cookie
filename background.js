const ONE_DAY_SECONDS = 7 * 24 * 60 * 60;

const cookie_names = ["SAMLAuthToken", "SAML"]

browser.cookies.onChanged.addListener(change => {
  if (change.removed) {
    return;
  }

  const cookie = change.cookie;

    console.log("cookie updated", {
        domain: cookie.domain,
        path: cookie.path
    }, cookie);

    if (!cookie_names.includes(cookie.name)) {
        return;
    }

  const newExpiration = Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS;

  console.log("overwriting", {domain: cookie.domain, name: cookie.name, newExpiration});

  browser.cookies.set({
    url: (cookie.secure ? "https://" : "http://") + cookie.domain.replace(/^\./, "") + cookie.path,
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    expirationDate: newExpiration
  });
});
