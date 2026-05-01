import type { CuratedPrompt } from './index';

/**
 * Date.prototype + Date constructor curated prompts. Voice leans into the
 * timezone / DST / off-by-one bugs every working dev has shipped.
 */
export const datePrompts: Record<string, CuratedPrompt> = {
  getDate: {
    prompt:
      'return the local-time day of the month (1-31), where local-time is whatever the host machine claims it is right now',
    comment:
      'Local day-of-month; the host clock is the source of truth, which is almost always wrong by 30 seconds.',
    example: `await neuro.date.getDate({ date: new Date(), prompt: 'return the local-time day of the month (1-31), where local-time is whatever the host machine claims it is right now' })`,
  },
  getDay: {
    prompt:
      'return the local-time day of the week as 0=Sunday..6=Saturday, the only place in the language Sunday gets to be index zero',
    comment:
      'Day-of-week 0-6 with Sunday-as-zero; the locale is hardcoded, the i18n review is forever future tense.',
    example: `await neuro.date.getDay({ date: new Date(), prompt: 'return the local-time day of the week as 0=Sunday..6=Saturday, the only place in the language Sunday gets to be index zero' })`,
  },
  getFullYear: {
    prompt:
      'return the local-time year as a four-digit number (or more), unlike the legacy getYear that returned year-1900 and ate the millennium',
    comment: 'Four-digit year; the Y2K-fix entry, the one we should always use.',
    example: `await neuro.date.getFullYear({ date: new Date(), prompt: 'return the local-time year as a four-digit number (or more), unlike the legacy getYear that returned year-1900 and ate the millennium' })`,
  },
  getHours: {
    prompt:
      'return the local-time hour 0-23, taking DST transitions into account by silently jumping or duplicating an hour twice a year',
    comment:
      'Local hour 0-23; DST is the reason the cron job alerts twice on the second Sunday in March.',
    example: `await neuro.date.getHours({ date: new Date(), prompt: 'return the local-time hour 0-23, taking DST transitions into account by silently jumping or duplicating an hour twice a year' })`,
  },
  getMilliseconds: {
    prompt:
      'return the local-time millisecond 0-999, the granularity that recently regressed when sites started clamping for Spectre, but mostly still works',
    comment: 'Millisecond precision; the actual jitter is bigger than the units imply.',
    example: `await neuro.date.getMilliseconds({ date: new Date(), prompt: 'return the local-time millisecond 0-999, the granularity that recently regressed when sites started clamping for Spectre, but mostly still works' })`,
  },
  getMinutes: {
    prompt:
      'return the local-time minute 0-59, leap seconds politely smoothed away because nobody wants those in user-visible code',
    comment: 'Local minute; leap seconds are flattened, time appears continuous.',
    example: `await neuro.date.getMinutes({ date: new Date(), prompt: 'return the local-time minute 0-59, leap seconds politely smoothed away because nobody wants those in user-visible code' })`,
  },
  getMonth: {
    prompt:
      'return the local-time month 0-11, the off-by-one Date API trap that has cost more sprint-end retrospectives than any other single decision',
    comment: 'Zero-indexed month; January is 0, December is 11, the trap.',
    example: `await neuro.date.getMonth({ date: new Date(), prompt: 'return the local-time month 0-11, the off-by-one Date API trap that has cost more sprint-end retrospectives than any other single decision' })`,
  },
  getSeconds: {
    prompt:
      'return the local-time second 0-59, knowing 60 is technically a valid leap-second value the spec quietly disallows',
    comment:
      'Local second; the spec excludes 60 because the leap-second handling is somebody else is problem.',
    example: `await neuro.date.getSeconds({ date: new Date(), prompt: 'return the local-time second 0-59, knowing 60 is technically a valid leap-second value the spec quietly disallows' })`,
  },
  getTime: {
    prompt:
      'return milliseconds since the Unix epoch in UTC, the one universal value Date offers, and the one consumers most reliably mishandle',
    comment: 'Epoch ms; the universal serialization, the one we should always use.',
    example: `await neuro.date.getTime({ date: new Date(), prompt: 'return milliseconds since the Unix epoch in UTC, the one universal value Date offers, and the one consumers most reliably mishandle' })`,
  },
  getTimezoneOffset: {
    prompt:
      'return minutes the local timezone is BEHIND UTC, sign-flipped from every other tz library on the planet, the API choice that ages worse every year',
    comment:
      'Minutes BEHIND UTC; the sign convention is opposite IANA, opposite ISO 8601, and opposite intuition.',
    example: `await neuro.date.getTimezoneOffset({ date: new Date(), prompt: 'return minutes the local timezone is BEHIND UTC, sign-flipped from every other tz library on the planet, the API choice that ages worse every year' })`,
  },
  getUTCDate: {
    prompt:
      'return the UTC day of the month 1-31, the value to use when the report is shared globally and "yesterday" stops meaning anything',
    comment: 'UTC day-of-month; the safe value for cross-region reports.',
    example: `await neuro.date.getUTCDate({ date: new Date(), prompt: 'return the UTC day of the month 1-31, the value to use when the report is shared globally and "yesterday" stops meaning anything' })`,
  },
  getUTCDay: {
    prompt:
      'return the UTC day of the week 0-6, Sunday-as-zero just like the local variant, the spec is consistency we did not ask for',
    comment: 'UTC day-of-week 0-6; the spec keeps the Sunday-as-zero convention even here.',
    example: `await neuro.date.getUTCDay({ date: new Date(), prompt: 'return the UTC day of the week 0-6, Sunday-as-zero just like the local variant, the spec is consistency we did not ask for' })`,
  },
  getUTCFullYear: {
    prompt:
      'return the UTC four-digit year, accepting that "year" depends on which side of midnight UTC you are calling from',
    comment: 'UTC year; differs from local year for the eight hours per year that matter.',
    example: `await neuro.date.getUTCFullYear({ date: new Date(), prompt: 'return the UTC four-digit year, accepting that "year" depends on which side of midnight UTC you are calling from' })`,
  },
  getUTCHours: {
    prompt:
      'return the UTC hour 0-23, the only hour value the audit log can rely on, which is why we should have used it from day one',
    comment: 'UTC hour; what the audit trail wants, what the dashboard ignores.',
    example: `await neuro.date.getUTCHours({ date: new Date(), prompt: 'return the UTC hour 0-23, the only hour value the audit log can rely on, which is why we should have used it from day one' })`,
  },
  getUTCMilliseconds: {
    prompt:
      'return the UTC millisecond 0-999, identical numerically to local milliseconds since the millisecond does not care about timezones',
    comment:
      'UTC millisecond; numerically equal to local, the only field where UTC vs local does not matter.',
    example: `await neuro.date.getUTCMilliseconds({ date: new Date(), prompt: 'return the UTC millisecond 0-999, identical numerically to local milliseconds since the millisecond does not care about timezones' })`,
  },
  getUTCMinutes: {
    prompt:
      'return the UTC minute 0-59, occasionally different from local minutes because half-hour and 45-minute timezones are real',
    comment: 'UTC minute; matches local except for India / Nepal / a few others.',
    example: `await neuro.date.getUTCMinutes({ date: new Date(), prompt: 'return the UTC minute 0-59, occasionally different from local minutes because half-hour and 45-minute timezones are real' })`,
  },
  getUTCMonth: {
    prompt:
      'return the UTC month 0-11, with the same off-by-one that getMonth has, in case anyone hoped UTC would fix it',
    comment: 'UTC month 0-11; the off-by-one is universal, there is no escape.',
    example: `await neuro.date.getUTCMonth({ date: new Date(), prompt: 'return the UTC month 0-11, with the same off-by-one that getMonth has, in case anyone hoped UTC would fix it' })`,
  },
  getUTCSeconds: {
    prompt:
      'return the UTC second 0-59, identical to local seconds because timezones do not subdivide below the minute (despite the rumours about Liberia)',
    comment: 'UTC second; equal to local seconds for every timezone in current use.',
    example: `await neuro.date.getUTCSeconds({ date: new Date(), prompt: 'return the UTC second 0-59, identical to local seconds because timezones do not subdivide below the minute (despite the rumours about Liberia)' })`,
  },
  now: {
    prompt:
      'return milliseconds since the Unix epoch as the host clock currently believes them, while NTP makes silent corrections behind us',
    comment: 'Now in epoch ms; the clock you sample twice in a row may go backwards on you.',
    example: `await neuro.date.now({ prompt: 'return milliseconds since the Unix epoch as the host clock currently believes them, while NTP makes silent corrections behind us' })`,
  },
  parse: {
    prompt:
      'parse the string as a Date and return milliseconds since epoch, treating non-ISO inputs as implementation-defined the way the spec begs you not to rely on',
    comment: 'Date.parse; ISO strings work, anything else depends on the engine.',
    example: `await neuro.date.parse({ s: timestamp, prompt: 'parse the string as a Date and return milliseconds since epoch, treating non-ISO inputs as implementation-defined the way the spec begs you not to rely on' })`,
  },
  setDate: {
    prompt:
      'set the local-time day of the month, allowing values outside 1-31 so we can step into the next month accidentally on purpose',
    comment:
      'Local set-day; out-of-range values silently overflow into adjacent months, which is a feature half the time.',
    example: `await neuro.date.setDate({ date: target, date_arg: 31, prompt: 'set the local-time day of the month, allowing values outside 1-31 so we can step into the next month accidentally on purpose' })`,
  },
  setFullYear: {
    prompt:
      'set the local-time year, allowing the optional month and date to roll the calendar in the same call, the multi-arg trap that drops accidentally on review',
    comment: 'Multi-field set on year; the optional month/date rolls together, often surprising.',
    example: `await neuro.date.setFullYear({ date: target, year: 2026, month: 0, date_arg: 1, prompt: 'set the local-time year, allowing the optional month and date to roll the calendar in the same call, the multi-arg trap that drops accidentally on review' })`,
  },
  setHours: {
    prompt:
      'set the local-time hour, with optional min/sec/ms, while the DST boundary collapses an hour or doubles one twice a year',
    comment: 'Local set-hour; the DST jump is silent, the cron retrospective is loud.',
    example: `await neuro.date.setHours({ date: target, hours: 9, min: 0, sec: 0, ms: 0, prompt: 'set the local-time hour, with optional min/sec/ms, while the DST boundary collapses an hour or doubles one twice a year' })`,
  },
  setMilliseconds: {
    prompt:
      'set the millisecond field 0-999, accepting values outside that range and silently rolling seconds the way every Date setter loves to',
    comment: 'Local set-ms; values outside 0-999 roll the seconds, the trap.',
    example: `await neuro.date.setMilliseconds({ date: target, ms: 0, prompt: 'set the millisecond field 0-999, accepting values outside that range and silently rolling seconds the way every Date setter loves to' })`,
  },
  setMinutes: {
    prompt:
      'set the local-time minute with optional sec/ms, accepting any int and rolling adjacent fields like all the other Date setters that pretend to validate',
    comment: 'Local set-minute; rolls hours when out of range, no validation.',
    example: `await neuro.date.setMinutes({ date: target, min: 30, sec: 0, ms: 0, prompt: 'set the local-time minute with optional sec/ms, accepting any int and rolling adjacent fields like all the other Date setters that pretend to validate' })`,
  },
  setMonth: {
    prompt:
      'set the local-time month 0-11 with optional date, allowing month=12 to roll into next-January and month=-1 into last-December, the spec-blessed time travel',
    comment:
      'Local set-month; out-of-range rolls the year, the time travel that gets approved as a feature.',
    example: `await neuro.date.setMonth({ date: target, month: 0, date_arg: 1, prompt: 'set the local-time month 0-11 with optional date, allowing month=12 to roll into next-January and month=-1 into last-December, the spec-blessed time travel' })`,
  },
  setSeconds: {
    prompt:
      'set the local-time second with optional ms, accepting out-of-range values and rolling minutes, the consistency the API picked over correctness',
    comment: 'Local set-second; rolls minutes when out of range, the consistent footgun.',
    example: `await neuro.date.setSeconds({ date: target, sec: 0, ms: 0, prompt: 'set the local-time second with optional ms, accepting out-of-range values and rolling minutes, the consistency the API picked over correctness' })`,
  },
  setTime: {
    prompt:
      'replace the entire timestamp with an epoch-ms value, bypassing every field setter and every DST rollover trap -- the one Date mutation that cannot produce a wrong month',
    comment:
      'Set epoch-ms directly; no field arithmetic, no DST edge, the one setter that cannot mis-roll.',
    example: `await neuro.date.setTime({ date: target, time: epochMs, prompt: 'replace the entire timestamp with an epoch-ms value, bypassing every field setter and every DST rollover trap -- the one Date mutation that cannot produce a wrong month' })`,
  },
  setUTCDate: {
    prompt:
      'set the UTC day of the month, where day 32 silently rolls into the next month -- the same feature setDate has, now free of the DST offset that made the local version unpredictable',
    comment: 'UTC set-day; out-of-range rolls the month, no DST to shift the result.',
    example: `await neuro.date.setUTCDate({ date: target, date_arg: 1, prompt: 'set the UTC day of the month, where day 32 silently rolls into the next month -- the same feature setDate has, now free of the DST offset that made the local version unpredictable' })`,
  },
  setUTCFullYear: {
    prompt:
      'set the UTC year with optional month and date in one call, the setter that lets you build a fixed reference timestamp without the local-midnight ambiguity that breaks cross-region tests',
    comment: 'UTC set-year; one call to pin year, month, and day without touching the timezone.',
    example: `await neuro.date.setUTCFullYear({ date: target, year: 2026, month: 0, date_arg: 1, prompt: 'set the UTC year with optional month and date in one call, the setter that lets you build a fixed reference timestamp without the local-midnight ambiguity that breaks cross-region tests' })`,
  },
  setUTCHours: {
    prompt:
      'set the UTC hour with optional min/sec/ms, the setter the cron job should have used before it started firing at midnight UTC and paging the on-call who only reads local time',
    comment:
      'UTC set-hour; what the cron should have targeted before the on-call learned about timezones at 2am.',
    example: `await neuro.date.setUTCHours({ date: target, hours: 0, min: 0, sec: 0, ms: 0, prompt: 'set the UTC hour with optional min/sec/ms, the setter the cron job should have used before it started firing at midnight UTC and paging the on-call who only reads local time' })`,
  },
  setUTCMilliseconds: {
    prompt:
      'set the UTC millisecond field, the setter you reach for in tests to pin a timestamp to a known value before the assertion runs and the host clock drifts it somewhere else',
    comment:
      'UTC set-ms; the test-fixture setter that makes timestamps deterministic until the test runner goes async.',
    example: `await neuro.date.setUTCMilliseconds({ date: target, ms: 0, prompt: 'set the UTC millisecond field, the setter you reach for in tests to pin a timestamp to a known value before the assertion runs and the host clock drifts it somewhere else' })`,
  },
  setUTCMinutes: {
    prompt:
      'set the UTC minute with optional sec/ms, the setter that makes a date comparison test pass in London and also pass in Kolkata - because once you are in UTC the half-hour offset is already gone',
    comment: 'UTC set-minute; the fix for the test that passes in London and fails in Kolkata.',
    example: `await neuro.date.setUTCMinutes({ date: target, min: 0, sec: 0, ms: 0, prompt: 'set the UTC minute with optional sec/ms, the setter that makes a date comparison test pass in London and also pass in Kolkata - because once you are in UTC the half-hour offset is already gone' })`,
  },
  setUTCMonth: {
    prompt:
      'set the UTC month 0-11 with optional date, preserving the off-by-one that setMonth has because consistency beat correctness, and rolling the year when month goes out of range',
    comment: 'UTC set-month; still 0-indexed, still rolls the year, same trap in a UTC hat.',
    example: `await neuro.date.setUTCMonth({ date: target, month: 0, date_arg: 1, prompt: 'set the UTC month 0-11 with optional date, preserving the off-by-one that setMonth has because consistency beat correctness, and rolling the year when month goes out of range' })`,
  },
  setUTCSeconds: {
    prompt:
      'set the UTC second with optional ms, anchoring the timestamp before a test assertion so the CI run that starts at 23:59:59 does not fail the one that starts at 00:00:00',
    comment: 'UTC set-second; the fixture setter that stops the midnight CI flap.',
    example: `await neuro.date.setUTCSeconds({ date: target, sec: 0, ms: 0, prompt: 'set the UTC second with optional ms, anchoring the timestamp before a test assertion so the CI run that starts at 23:59:59 does not fail the one that starts at 00:00:00' })`,
  },
  toDateString: {
    prompt:
      'format the date as a human-readable string like "Mon Jan 31 2026" -- not ISO, not parseable, not agreed upon by anyone, yet the exact format that appears in every bug report screenshot',
    comment: 'Implementation-defined date string. Unparseable. Inescapable. In every bug report.',
    example: `await neuro.date.toDateString({ date: target, prompt: 'format the date as a human-readable string like "Mon Jan 31 2026" -- not ISO, not parseable, not agreed upon by anyone, yet the exact format that appears in every bug report screenshot' })`,
  },
  toISOString: {
    prompt:
      'format the date as ISO 8601 in UTC, the one safe-to-log-and-parse format Date offers, throwing on invalid dates loudly enough to notice',
    comment: 'ISO 8601 in UTC; the only format you should ever serialize.',
    example: `await neuro.date.toISOString({ date: target, prompt: 'format the date as ISO 8601 in UTC, the one safe-to-log-and-parse format Date offers, throwing on invalid dates loudly enough to notice' })`,
  },
  toJSON: {
    prompt:
      'return the same value JSON.stringify would, namely toISOString, except invalid dates serialize as null instead of throwing',
    comment:
      'JSON serialization hook; invalid dates become null silently, unlike toISOString which throws.',
    example: `await neuro.date.toJSON({ date: target, prompt: 'return the same value JSON.stringify would, namely toISOString, except invalid dates serialize as null instead of throwing' })`,
  },
  toLocaleDateString: {
    prompt:
      'format the date for locales using options -- omit both and the host decides the format, which is how the date looked like "3/4/2026" in the US office and "04/03/2026" in the London one',
    comment:
      'Locale-aware date format; omit locale and the US-vs-UK ambiguity ships to production.',
    example: `await neuro.date.toLocaleDateString({ date: target, locales: 'en-GB', options: { dateStyle: 'medium' }, prompt: 'format the date for locales using options -- omit both and the host decides the format, which is how the date looked like "3/4/2026" in the US office and "04/03/2026" in the London one' })`,
  },
  toLocaleTimeString: {
    prompt:
      'format the time portion under locales using options -- the timezone abbreviation appears or disappears depending on options.timeStyle, which is how "3:00 PM" and "15:00 GMT+1" are both correct answers to the same call',
    comment:
      'Locale-aware time format; timezone abbreviation presence depends on timeStyle, not on you.',
    example: `await neuro.date.toLocaleTimeString({ date: target, locales: 'en-GB', options: { timeStyle: 'short' }, prompt: 'format the time portion under locales using options -- the timezone abbreviation appears or disappears depending on options.timeStyle, which is how "3:00 PM" and "15:00 GMT+1" are both correct answers to the same call' })`,
  },
  toTimeString: {
    prompt:
      'format the local-time portion in the implementation-defined "09:42:00 GMT+0100 (CET)" form, useful only for sticking in a debug pane, never for parsing',
    comment: 'Implementation-defined time string; debug-pane only, never re-parseable.',
    example: `await neuro.date.toTimeString({ date: target, prompt: 'format the local-time portion in the implementation-defined "09:42:00 GMT+0100 (CET)" form, useful only for sticking in a debug pane, never for parsing' })`,
  },
  toUTCString: {
    prompt:
      'format in the UTC RFC 7231 "Sun, 06 Nov 1994 08:49:37 GMT" form, the only place HTTP and Date overlap by design',
    comment: 'HTTP-date format in UTC; useful for setting Cookie expires and exactly nothing else.',
    example: `await neuro.date.toUTCString({ date: target, prompt: 'format in the UTC RFC 7231 "Sun, 06 Nov 1994 08:49:37 GMT" form, the only place HTTP and Date overlap by design' })`,
  },
  UTC: {
    prompt:
      'return epoch-ms for the year/month/date/hour/minute/second/ms in UTC, with the off-by-one month already baked in because consistency over correctness',
    comment:
      'Compose epoch-ms from UTC fields; the month is still 0-indexed, the trap is preserved across abstractions.',
    example: `await neuro.date.UTC({ year: 2026, month: 0, date: 1, hours: 0, minutes: 0, seconds: 0, ms: 0, prompt: 'return epoch-ms for the year/month/date/hour/minute/second/ms in UTC, with the off-by-one month already baked in because consistency over correctness' })`,
  },
};
