chrome.webRequest.onHeadersReceived.addListener(
  async details => {
    const { domains = {} } = await chrome.storage.local.get("domains");
    const now = Math.floor(Date.now() / 1000);

    const newHeaders = [];
    // const newCookies = {};
    const overwritten = [];

    for (const header of details.responseHeaders) {
      if (header.name.toLowerCase() !== "set-cookie") {
        newHeaders.push(header);
        continue;
      }
      // console.log(header);

      const cookies = header.value.split(/\r?\n/);
      // console.log(cookies);

      for (const cookieStr of cookies) {
        // console.log(cookieStr);
        const m = cookieStr.match(/^([^=]+)=([^;]*)(.*)$/);
        if (!m) continue;

        const cookieName = m[1].trim();
        const cookieValue = m[2].trim();
        let attrs = m[3] || "";

        // get domain from attributes or fallback to request URL
        const domainMatch = attrs.match(/;\s*Domain=([^;]+)/i);
        const cookieDomain = domainMatch ? domainMatch[1].replace(/^\./, "") : new URL(details.url).hostname;

        const ruleEntry = matchRuleForDomain(cookieDomain, domains);
        if (!ruleEntry) {
          // console.log("No rule", cookieName);
          newHeaders.push({ name: "Set-Cookie", value: cookieStr });
          continue;
        }

        const rule = ruleEntry;
        if (!rule.enabled) {
          // console.log("Rule disabled", cookieName);
          newHeaders.push({ name: "Set-Cookie", value: cookieStr });
          continue;
        }

        const cookieOverride = rule.cookies?.[cookieName];
        if (cookieOverride && cookieOverride.enabled === false) {
          // console.log("Single cookie override refused", cookieName);
          newHeaders.push({ name: "Set-Cookie", value: cookieStr });
          continue;
        }

        const duration = cookieOverride?.duration ?? rule.duration;

        // compute current remaining lifetime
        let remaining = 0;
        const maxAgeMatch = attrs.match(/;\s*Max-Age=([^;]+)/i);
        const expiresMatch = attrs.match(/;\s*Expires=([^;]+)/i);

        console.log(cookieName, maxAgeMatch, expiresMatch);

        if (maxAgeMatch) {
          remaining = parseInt(maxAgeMatch[1], 10);
        } else if (expiresMatch) {
          const expDate = new Date(expiresMatch[1]);
          remaining = Math.floor(expDate.getTime() / 1000) - now;
        } else {
          // console.log("no timeout (session)", cookieName);
          // newHeaders.push({ name: "Set-Cookie", value: cookieStr });
          remaining = 0;
        }

        // only override if remaining < desired duration
        if (remaining >= duration) {
          // console.log("Long enough", cookieName);
          newHeaders.push({ name: "Set-Cookie", value: cookieStr });
          continue;
        }

        attrs = attrs.replace(/;\s*Max-Age=[^;]+/i, "");
        attrs = attrs.replace(/;\s*Expires=[^;]+/i, "");

        const newCookieStr = `${cookieName}=${cookieValue}${attrs}; Max-Age=${duration}`;
        // newCookies[`${cookieDomain}:${cookieName}`] = newCookieStr;
        newHeaders.push({ name: "Set-Cookie", value: newCookieStr });
        // console.log("added:", newCookieStr);

        overwritten.push({
          timestamp: new Date().toISOString(),
          domain: cookieDomain,
          cookie: cookieName,
          previousDuration: remaining,
          overwrittenDuration: duration
        });
      }
    }

    // console.log("new:", newHeaders);
    // console.log("overwritten:", overwritten);

    (async () => {
      try {
        const { logs = [] } = await chrome.storage.local.get("logs");
        logs.push(...overwritten);
        if (logs.length > 25) logs.splice(0, logs.length - 25);
        await chrome.storage.local.set({ logs });
      } catch (e) {
        console.error(e);
      }
    })();

    return { responseHeaders: newHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

function matchRuleForDomain(cookieDomain, domains) {
  const entries = Object.entries(domains);

  // exact match first
  for (const [pattern, rule] of entries) {
    //console.log(pattern, cookieDomain);
    if (pattern === cookieDomain) {
      return rule;
    }
  }

  // collect matches with wildcard
  const matches = [];

  for (const [pattern, rule] of entries) {
    //console.log(pattern, cookieDomain);
    if (pattern.includes("*")) {
      // escape regex chars except *
      const escaped = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
      // replace * => [^.]+
      const regexString = "^" + escaped.replace(/\*/g, "[^.]+") + "$";
      const regex = new RegExp(regexString);

      if (regex.test(cookieDomain)) {
        matches.push({ pattern, rule });
      }
    }
  }

  // if no wildcard match
  if (matches.length === 0) {
    return undefined;
  }

  // pick longest pattern (more specific)
  matches.sort((a, b) => b.pattern.length - a.pattern.length);

  //console.log(matches[0].rule);

  return matches[0].rule;
}

