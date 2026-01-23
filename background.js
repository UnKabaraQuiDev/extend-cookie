browser.cookies.onChanged.addListener(async change => {
  if (change.removed) return;

  const cookie = change.cookie;
  const domain = cookie.domain.replace(/^\./, "");

  const { domains = {} } = await browser.storage.local.get("domains");
  const ruleEntry = matchRuleForDomain(domain, domains);
  if (!ruleEntry) return;

  const rule = ruleEntry;
  if (!rule.enabled) return;

  const cookieOverride = rule.cookies?.[cookie.name];
  if (cookieOverride && cookieOverride.enabled === false) return;

  const duration = cookieOverride?.duration ?? rule.duration;
  const now = Math.floor(Date.now() / 1000);

  // compute current remaining lifetime
  const currentExpiration = cookie.expirationDate || now;
  const remaining = currentExpiration - now;

  // only extend if remaining < desired duration
  if (remaining >= duration) {
    console.log("skipping", currentExpiration, duration, remaining, cookie.name, cookie.value, cookie);
    return;
  }else {
    console.log("setting", currentExpiration, duration, remaining, cookie.name, cookie.value, cookie);
  }

  const newExpiration = now + duration;

  // overwrite cookie
  const nCookie = cookie;
  nCookie.expirationDate = newExpiration;
  browser.cookies.set(nCookie);

  // log the override
  const { logs = [] } = await browser.storage.local.get("logs");
  const timestamp = new Date().toISOString();
  const previousDur = remaining > 0 ? remaining : 0;

  logs.push({
    timestamp,
    domain,
    cookie: cookie.name,
    previousDuration: previousDur,
    overwrittenDuration: duration
  });

  if (logs.length > 25) logs.splice(0, logs.length - 25); // keep last 25

  await browser.storage.local.set({ logs });
});



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

