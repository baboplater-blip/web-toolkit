/**
 * English how-to guide content for curated tools.
 *
 * Mirrors `lib/guide-content.ts` (Korean) but emits English copy and is driven
 * by the curated English names in `lib/en-tools.ts`. The category pattern
 * (file / generator / text) is shared with the Korean builder via getPattern,
 * so both languages stay structurally aligned.
 *
 * Server-component only — the result is baked into static HTML, no CSR.
 */

import type { ToolMeta } from '@/lib/tools/registry';
import { getPattern, type GuidePattern } from '@/lib/guide-content';
import type { EnToolCopy } from '@/lib/en-tools';

export interface GuideStepEn {
  title: string;
  body: string;
}

export interface GuideContentEn {
  /** <title> (under ~60 chars). */
  metaTitle: string;
  /** meta description (under ~155 chars). */
  metaDescription: string;
  /** intro paragraph under the H1. */
  intro: string;
  /** 3–5 key feature bullets. */
  features: string[];
  /** step-by-step instructions. */
  steps: GuideStepEn[];
  /** FAQ entries. */
  faqs: Array<{ q: string; a: string }>;
}

/**
 * Per-tool hand-written guide override (English).
 *
 * The pattern builder emits copy that fits "any tool", which is weak for
 * long-tail SEO and dwell time. High-demand tools get bespoke copy here —
 * real scenarios, concrete examples, and gotchas — layered over the
 * auto-generated base. Only the fields you set are replaced.
 *
 * Provide `faqs` and the three common FAQs (privacy / free / mobile) are
 * appended automatically.
 */
export interface GuideOverrideEn {
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  features?: string[];
  steps?: GuideStepEn[];
  faqs?: Array<{ q: string; a: string }>;
}

/** Common FAQs shared by every pattern (privacy / free / mobile). */
export const COMMON_FAQS_EN: Array<{ q: string; a: string }> = [
  {
    q: 'Are my files uploaded to a server?',
    a: 'No. Only Web Workers, WebAssembly and the Canvas API are used, so everything is processed inside your browser. You can open the Network tab to verify it yourself.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. No signup, no payment, no usage limits. The site is supported by ads, and we do not collect or sell your data.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes. Every tool is designed mobile-first and verified on iOS Safari and Android Chrome. Add it to your home screen to use it like an app.',
  },
];

/** High-demand tools with bespoke English guides. Keyed by tool id. */
export const CUSTOM_GUIDES_EN: Record<string, GuideOverrideEn> = {
  'css-units': {
    metaTitle: 'CSS Unit Converter (px to rem, em, pt) — Free Online',
    metaDescription:
      'Convert px, rem, em and pt instantly. Type 16px and get 1rem at a 16px root, or change the root font-size to see how 24px becomes 1.5rem. Free, no signup.',
    intro:
      'This CSS unit converter turns a value in px, rem, em or pt into all four units at once. Enter 16px with a 16px root font-size and you instantly get 1rem, 1em and 12pt; bump the value to 24px and it shows 1.5rem. Change the root font-size field and every conversion recalculates live.',
    features: [
      'Converts px, rem, em and pt all at the same time — one input, four outputs.',
      'Adjustable root font-size (defaults to 16px, the browser default) so rem/em scale to your real base.',
      'Uses the CSS standard 1px = 0.75pt (96/72) for accurate point conversion.',
      'Copy any single result (e.g. just the "1rem" row) to your clipboard with one tap.',
      'Runs entirely in your browser with no signup or upload.',
    ],
    steps: [
      {
        title: 'Enter the value and pick its unit',
        body: 'Type a number in the value box and choose its unit from the dropdown — for example 16 with px selected. The unit you pick is the source the others are converted from.',
      },
      {
        title: 'Set the root font-size if needed',
        body: 'The root font-size field defaults to 16px. If your project sets html { font-size: 62.5% } (10px), enter 10 here so 16px correctly resolves to 1.6rem instead of 1rem.',
      },
      {
        title: 'Read and copy the conversions',
        body: 'All four rows update instantly: 16px shows as 1rem, 1em and 12pt. Tap "Copy" on the row you need to grab just that value (e.g. "1rem") for your stylesheet.',
      },
    ],
    faqs: [
      {
        q: 'How many px is 1rem?',
        a: '1rem equals the root font-size, which is 16px by default in every browser. So 1rem = 16px, 1.5rem = 24px, and 0.5rem = 8px — unless you override html { font-size }.',
      },
      {
        q: 'What is the difference between rem and em here?',
        a: 'rem is always relative to the root (html) font-size. Real em is relative to the parent element. This tool resolves em against the root font-size too, so for a top-level conversion rem and em give the same number — set the root field to your effective base.',
      },
      {
        q: 'How do px and pt relate?',
        a: 'By the CSS spec 1px = 1/96 inch and 1pt = 1/72 inch, so 1px = 0.75pt and 16px = 12pt. pt is mainly used for print stylesheets.',
      },
    ],
  },

  'chmod-calc': {
    metaTitle: 'Chmod Calculator — Octal ↔ Symbolic (755 = rwxr-xr-x)',
    metaDescription:
      'Convert Unix file permissions between octal and symbolic. Tick read/write/execute boxes to get 755, or type 644 to see rw-r--r--. Free chmod calculator, no signup.',
    intro:
      'This chmod calculator converts Unix file permissions between octal (like 755) and symbolic (like rwxr-xr-x) notation. Tick the read/write/execute boxes for owner, group and other and it shows the octal digits live; or type 644 in the octal box and the checkboxes flip to rw-r--r--.',
    features: [
      'Two-way conversion: check boxes to build the octal, or type the octal to see the symbolic string.',
      'Separate read (4), write (2) and execute (1) toggles for owner, group and other.',
      'Validates octal input — rejects anything that is not three digits of 0–7 (e.g. it flags 888).',
      'Copy the octal (755) or the symbolic string (rwxr-xr-x) with one click.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Set the permissions',
        body: 'Tick the read, write and execute boxes for owner, group and other. For a typical script you would check all three for owner (rwx = 7) and read+execute for group and other (r-x = 5), giving 755.',
      },
      {
        title: 'Or type the octal directly',
        body: 'Prefer to start from a number? Type it in the octal box — enter 644 and the checkboxes update to rw-r--r-- (owner can read/write, everyone else read-only). Invalid input like 99 is flagged with an error.',
      },
      {
        title: 'Copy what you need',
        body: 'Copy either form: the octal "755" to paste into chmod 755 file.sh, or the symbolic "rwxr-xr-x" to compare against ls -l output.',
      },
    ],
    faqs: [
      {
        q: 'What does chmod 755 mean?',
        a: '755 is rwxr-xr-x: the owner can read, write and execute (7), while group and other can read and execute but not write (5). It is the standard for directories and executable scripts.',
      },
      {
        q: 'What is the difference between 755 and 644?',
        a: '755 (rwxr-xr-x) grants execute permission, so it suits scripts and folders. 644 (rw-r--r--) has no execute bit — the owner can edit, everyone else can only read — which is right for regular files like HTML, images or config.',
      },
      {
        q: 'How are the octal digits calculated?',
        a: 'Each digit sums read=4, write=2 and execute=1. So rwx = 4+2+1 = 7, r-x = 4+1 = 5, and rw- = 4+2 = 6. The three digits are owner, group, then other.',
      },
      {
        q: 'Does this handle setuid, setgid or the sticky bit?',
        a: 'No. This calculator covers the standard three-digit permissions (owner/group/other). The leading fourth digit for setuid/setgid/sticky (e.g. the 1 in 1777) is not included.',
      },
    ],
  },

  'http-status': {
    metaTitle: 'HTTP Status Code Lookup — 404, 301 vs 302, 500',
    metaDescription:
      'Look up any HTTP status code by number or name. Search "404" for Not Found, compare 301 vs 302 redirects, or filter 4xx client errors. Free reference, no signup.',
    intro:
      'This HTTP status code reference lets you search every common code by number or name and see what it means. Type "404" to get Not Found, "redirect" to list the 3xx family, or "429" to learn it means Too Many Requests. Each result is colour-coded by class (2xx success, 4xx client error, 5xx server error).',
    features: [
      'Search by code (404), name (Not Found) or keyword (redirect) and the list filters instantly as you type.',
      'Covers 1xx–5xx: informational, success, redirection, client error and server error codes.',
      'Colour-coded class badges so you can tell a 3xx redirect from a 5xx server error at a glance.',
      'Plain-English meaning for each code, including the often-confused 301 vs 302 and 401 vs 403.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Type a code or name',
        body: 'Enter a number like 404, a name like "Gateway", or a keyword like "redirect" into the search box. The list narrows as you type — searching 50 also brings up every 5xx code.',
      },
      {
        title: 'Read the meaning and class',
        body: 'Each card shows the code, its official name and a one-line explanation, plus a coloured class label — for example 404 Not Found is tagged as a client error (4xx).',
      },
      {
        title: 'Compare related codes',
        body: 'Search a family to compare members side by side: type "30" to see 301, 302, 307 and 308 together and pick the right redirect for your case.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between 301 and 302?',
        a: '301 Moved Permanently tells browsers and search engines the URL has changed for good, so they update bookmarks and pass SEO weight. 302 Found is a temporary move — clients keep using the original URL. Use 301 for permanent migrations, 302 for short-lived redirects.',
      },
      {
        q: 'What does a 404 mean and is it my fault?',
        a: '404 Not Found means the server reached the path but has no resource there — usually a typo in the URL, a deleted page or a broken link. It is a client-side request issue, not a server crash (that would be a 5xx).',
      },
      {
        q: 'What is the difference between 401 and 403?',
        a: '401 Unauthorized means you are not authenticated — log in first. 403 Forbidden means you are authenticated but still not allowed to access the resource. In short: 401 = who are you, 403 = you cannot do that.',
      },
    ],
  },

  'json-to-go': {
    metaTitle: 'JSON to Go Struct Converter — Free Online Generator',
    metaDescription:
      'Paste JSON and get a Go struct with json tags. {"id":1,"name":"kim"} becomes a struct with Id int and Name string. Nested objects become named structs. Free, no signup.',
    intro:
      'This converter turns a JSON sample into a ready-to-use Go struct with proper json tags. Paste {"id": 1, "name": "kim", "tags": ["a","b"]} and it generates a struct with Id int, Name string and Tags []string, each carrying its `json:"..."` tag. Nested objects are extracted into their own named structs.',
    features: [
      'Generates exported Go fields with json tags — "user_name" becomes UserName with `json:"user_name"`.',
      'Infers types: whole numbers map to int, decimals to float64, true/false to bool, and null or mixed arrays to interface{}.',
      'Extracts nested objects into separate named structs and de-duplicates names automatically.',
      'Lets you set the root struct name (defaults to AutoGenerated) and copy the result in one click.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Paste your JSON',
        body: 'Drop a representative sample into the input, for example {"id": 1, "name": "kim", "tags": ["a", "b"]}. Use real data so number vs decimal types are inferred correctly.',
      },
      {
        title: 'Name the root struct',
        body: 'Type a name like "User" in the top field. The generator emits type User struct { ... }; leave it blank to use the default AutoGenerated. Nested objects get their own names derived from the field.',
      },
      {
        title: 'Copy the generated struct',
        body: 'The Go code appears instantly — Id int, Name string, Tags []string with json tags. Click "Copy" and paste it into your .go file.',
      },
    ],
    faqs: [
      {
        q: 'How are number types decided?',
        a: 'A whole number like 1 becomes int, while a number with a decimal like 1.5 becomes float64. Because the type comes from the sample, give a value like 0.0 if a field should always be a float.',
      },
      {
        q: 'What happens with null values or mixed arrays?',
        a: 'A null value, an empty array, or an array whose elements have different types maps to interface{} (or []interface{}), since Go needs a single concrete type and the sample does not provide one.',
      },
      {
        q: 'How are field names like "user_name" converted?',
        a: 'Keys are converted to exported PascalCase (user_name → UserName, user-name → UserName) so they are visible outside the package, and the original key is preserved in a `json:"user_name"` tag so marshalling still matches the API.',
      },
      {
        q: 'Does it handle nested objects?',
        a: 'Yes. Each nested object becomes its own named struct referenced by the parent, and duplicate names get a numeric suffix so the generated code always compiles.',
      },
    ],
  },

  'color-name': {
    metaTitle: 'Color Name Finder — Nearest CSS Name for HEX/RGB',
    metaDescription:
      'Find the closest CSS color name for any HEX or RGB value. #ff0000 returns red, #4169e1 returns royalblue. Searches all ~140 named colors. Free, no signup.',
    intro:
      'This tool finds the nearest CSS named color for a HEX or RGB value. Enter #ff0000 and it returns red (an exact match); enter #4267b2 and it tells you the closest name is royalblue and shows both swatches side by side. It compares against all ~140 standard CSS color names.',
    features: [
      'Accepts #rgb, #rrggbb and rgb(r, g, b) input — for example #4169e1 or rgb(65, 105, 225).',
      'Returns the nearest of the ~140 standard CSS named colors, and flags when it is an exact match.',
      'Shows swatches for both your input color and the matched name so you can judge the difference.',
      'Copy the color name (e.g. "royalblue") to paste straight into your CSS.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Enter a color',
        body: 'Type a HEX or RGB value into the box — for example #ff6347, #f63 or rgb(255, 99, 71). Invalid formats are flagged so you know to fix them.',
      },
      {
        title: 'See the nearest name',
        body: 'The result shows the closest CSS color name with its HEX — #ff6347 matches tomato exactly, while an off value like #ff6a4d reports tomato as the nearest (not exact) match.',
      },
      {
        title: 'Copy the name',
        body: 'Click "Copy" to grab the name (e.g. "tomato") and use it directly in CSS as color: tomato instead of a raw hex code.',
      },
    ],
    faqs: [
      {
        q: 'How is the nearest color chosen?',
        a: 'It computes the straight-line (Euclidean) distance in RGB space between your color and every named color, then picks the smallest. This is fast and works well, though it does not perfectly match human perception the way a Lab/CIEDE2000 metric would.',
      },
      {
        q: 'Which color names are supported?',
        a: 'All ~140 standard CSS named colors — the same set browsers recognise, from aliceblue and red through to rebeccapurple and yellowgreen.',
      },
      {
        q: 'How do I know if it is an exact match?',
        a: 'When your input lands exactly on a named color the result is labelled "exact match". For example #ff0000 is exactly red and #000000 is exactly black; anything else is shown as the closest approximation.',
      },
    ],
  },

  'code-case': {
    metaTitle: 'Case Converter — camelCase, snake_case, kebab-case, Pascal',
    metaDescription:
      'Convert identifiers between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and Title Case at once. userProfileId becomes user_profile_id. Free, no signup.',
    intro:
      'This case converter rewrites a programming identifier into six naming conventions at once. Type userProfileId (or user-profile-id) and it instantly shows userProfileId, UserProfileId, user_profile_id, user-profile-id, USER_PROFILE_ID and User Profile Id. Paste multiple lines and each line is converted independently.',
    features: [
      'Converts to six cases simultaneously: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and Title Case.',
      'Smart tokenizer splits on case boundaries, underscores, hyphens and spaces — getHTTPResponse splits correctly into get, http, response.',
      'Multi-line input: paste a column of identifiers and every line is converted in place.',
      'Copy any single case column (e.g. just the snake_case output) with one click.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Type or paste an identifier',
        body: 'Enter an identifier in any style — userProfileId, user_profile_id or user-profile-id all work. The tokenizer figures out the word boundaries automatically.',
      },
      {
        title: 'Read all six conversions',
        body: 'Every case appears at once: userProfileId → user_profile_id (snake), user-profile-id (kebab) and USER_PROFILE_ID (constant). Convert a whole list by pasting one identifier per line.',
      },
      {
        title: 'Copy the case you need',
        body: 'Each result row has its own copy button — grab just the kebab-case version for a CSS class, or CONSTANT_CASE for an env variable name.',
      },
    ],
    faqs: [
      {
        q: 'How are word boundaries detected?',
        a: 'The tokenizer splits on case changes (camelCase → camel, case), on underscores, hyphens and spaces, and handles acronym runs — so getHTTPResponse becomes get / http / response rather than one blob.',
      },
      {
        q: 'Can I convert a whole list at once?',
        a: 'Yes. Put one identifier per line in the input and each line is converted independently, so you can paste a column of field names and copy the converted column back out.',
      },
      {
        q: 'What is the difference between snake_case and CONSTANT_CASE?',
        a: 'Both join words with underscores, but snake_case is all lowercase (user_profile_id) while CONSTANT_CASE is all uppercase (USER_PROFILE_ID). snake_case suits variables and file names; CONSTANT_CASE is the convention for constants and environment variables.',
      },
    ],
  },

  'tip-calc': {
    metaTitle: 'Tip Calculator with Split — Tip Amount & Per Person',
    metaDescription:
      'Calculate the tip and split the bill per person. A 50,000 bill at 15% adds 7,500 for a 57,500 total; split 4 ways that is 14,375 each. Free tip calculator, no signup.',
    intro:
      'This tip calculator works out the tip amount, the grand total and the per-person share. Enter a 50,000 bill, tap the 15% preset and set 4 people, and it shows a 7,500 tip, a 57,500 total and 14,375 each. Change any field and all three numbers recalculate instantly.',
    features: [
      'One-tap tip presets (10%, 15%, 18%, 20%) plus a field for any custom percentage.',
      'Splits the total evenly across any number of people and shows the per-person amount.',
      'Live calculation — change the bill, percent or headcount and tip, total and split all update at once.',
      'Copy a clean summary (tip, total, per person) to share in a message.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Enter the bill amount',
        body: 'Type the pre-tip total into the bill field, for example 50000. Commas are handled automatically, so 50,000 works too.',
      },
      {
        title: 'Pick a tip percentage',
        body: 'Tap a preset like 15%, or type your own rate in the custom field (e.g. 18). On a 50,000 bill, 15% adds a 7,500 tip for a 57,500 total.',
      },
      {
        title: 'Set the headcount and split',
        body: 'Enter how many people are sharing — set 4 and the 57,500 total splits to 14,375 each. Tap "Copy" to grab the tip/total/per-person summary.',
      },
    ],
    faqs: [
      {
        q: 'Is the tip calculated on the pre-tax amount?',
        a: 'The tip percentage is applied to whatever bill amount you enter. If you want to tip on the pre-tax subtotal, enter the subtotal; if you prefer to tip on the post-tax total, enter that instead.',
      },
      {
        q: 'How is the per-person amount rounded?',
        a: 'The total (bill plus tip) is divided evenly by the number of people and shown rounded to the nearest whole unit. With an uneven split the rounded shares may differ by one unit from the exact total.',
      },
      {
        q: 'Can I use a custom tip percentage?',
        a: 'Yes. Beyond the 10/15/18/20% presets there is a free-entry field, so you can type any rate such as 12.5 and the tip and total update immediately.',
      },
    ],
  },

  'subnet-calc': {
    metaTitle: 'Subnet Calculator (IPv4 CIDR) — Network, Hosts, /24',
    metaDescription:
      'IPv4 CIDR subnet calculator. 192.168.0.1/24 gives network 192.168.0.0, broadcast 192.168.0.255 and 254 usable hosts. Slide the prefix /0–/32. Free, no signup.',
    intro:
      'This IPv4 subnet calculator takes an address and a CIDR prefix and works out the netmask, network and broadcast addresses, the usable host range and the host count. Enter 192.168.0.1 and slide to /24 and it shows network 192.168.0.0, broadcast 192.168.0.255, hosts 192.168.0.1–.254 and 254 usable addresses.',
    features: [
      'Slide the CIDR prefix from /0 to /32 and every value recalculates live.',
      'Shows netmask, wildcard mask, network address, broadcast address, first/last usable host and total usable hosts.',
      'Handles edge prefixes correctly — /31 and /32 report 0 usable hosts per convention.',
      'Validates the address and rejects bad input like 256.0.0.1 or leading-zero octets.',
      'Copy any single value (e.g. the network address) with one click.',
    ],
    steps: [
      {
        title: 'Enter an IPv4 address',
        body: 'Type a dotted-decimal address such as 192.168.0.1. Invalid input like 192.168.0.256 or 010.0.0.1 is flagged so you can correct it.',
      },
      {
        title: 'Choose the CIDR prefix',
        body: 'Drag the prefix slider to your subnet size — set /24 for a typical home or office LAN. The netmask shows as 255.255.255.0 and the host count as 254.',
      },
      {
        title: 'Read and copy the results',
        body: 'See the network (192.168.0.0), broadcast (192.168.0.255) and usable range (.1–.254). Tap "Copy" on any row to paste the value into a router config or ticket.',
      },
    ],
    faqs: [
      {
        q: 'How many usable hosts are in a /24?',
        a: 'A /24 has 256 total addresses, but the network address (.0) and broadcast address (.255) are reserved, leaving 254 usable host addresses — the range 192.168.0.1 to 192.168.0.254.',
      },
      {
        q: 'Why do /31 and /32 show 0 usable hosts?',
        a: 'A /32 is a single address with no host range, and a /31 has only two addresses with no room for separate network and broadcast, so this tool reports 0 usable hosts. In practice /31 is used for point-to-point links per RFC 3021, where both addresses are assignable.',
      },
      {
        q: 'What is the wildcard mask for?',
        a: 'The wildcard mask is the bitwise inverse of the netmask (a /24 netmask 255.255.255.0 has wildcard 0.0.0.255). It is used in access control lists, notably on Cisco devices, to specify which bits can vary.',
      },
    ],
  },

  bcrypt: {
    metaTitle: 'Bcrypt Hash Generator & Verifier — Free Online',
    metaDescription:
      'Generate and verify bcrypt password hashes in your browser. Hash a password at cost 10 to get a $2a$10$ hash, or check a password against an existing hash. Free, no upload.',
    intro:
      'This bcrypt tool generates and verifies password hashes entirely in your browser. In Hash mode, enter a password and a cost factor (default 10) to produce a $2a$10$… hash with the salt built in. In Verify mode, paste a password and an existing hash to check whether they match — useful for testing a login.',
    features: [
      'Two modes: generate a bcrypt hash, or verify a password against an existing hash.',
      'Adjustable cost factor from 4 to 15 (default 10), with a warning when high values will be slow.',
      'The random salt is generated automatically and embedded in the output hash — no separate salt field.',
      'Verify reports a clear match / no-match result for the password and hash you provide.',
      'Runs entirely in your browser — passwords are never sent to a server.',
    ],
    steps: [
      {
        title: 'Choose hash or verify mode',
        body: 'Tap "Hash" to create a new hash from a password, or "Verify" to test a password against a hash you already have (for example one pulled from your database).',
      },
      {
        title: 'Set the cost and generate',
        body: 'In Hash mode, enter the password and slide the cost factor (10 is a sensible default). Click Generate to get a hash like $2a$10$N9qo8uLOickgx2ZMRZoMy… Each run produces a different hash because the salt is random.',
      },
      {
        title: 'Verify a password',
        body: 'In Verify mode, paste the password and the full $2a$… hash and click Verify. It returns "match" if they correspond or "no match" otherwise — handy for confirming a stored hash.',
      },
    ],
    faqs: [
      {
        q: 'Where is the salt stored?',
        a: 'Bcrypt embeds the salt inside the hash string itself. In $2a$10$N9qo8uLOickgx2ZMRZoMye… the part after the cost is the 22-character base64 salt, followed by the hash. That is why every hash of the same password looks different and you never store a salt separately.',
      },
      {
        q: 'What cost factor should I use?',
        a: 'Cost 10–12 is the common range for web apps. Each step doubles the work, so cost 12 is four times slower than cost 10. Pick the highest value your server can tolerate at login time (a few hundred milliseconds) to slow down brute-force attacks.',
      },
      {
        q: 'Why does the same password produce a different hash every time?',
        a: 'Because a fresh random salt is generated on each run and mixed into the hash. This is intentional — it stops attackers from using precomputed rainbow tables. Verification still works because the salt is read back out of the stored hash.',
      },
      {
        q: 'Is it safe to hash a real password here?',
        a: 'Yes. The hashing runs locally with the bcryptjs library in your browser and nothing is uploaded. That said, for a production login you should generate hashes on your server so plaintext passwords never travel to the client at all.',
      },
    ],
  },

  'wifi-qr': {
    metaTitle: 'WiFi QR Code Generator — Free, Scan to Connect',
    metaDescription:
      'Create a WiFi QR code from your network name and password. Phones scan it to join instantly — no typing. Supports WPA/WPA2, WEP, open and hidden networks. Free, no signup.',
    intro:
      'This WiFi QR code generator turns your network name, password and security type into a scannable QR code. A guest points their phone camera at it and joins your WiFi without typing the password. It builds the standard WIFI:T:WPA;S:…;P:…; payload and exports the code as a PNG you can print or display.',
    features: [
      'Encodes the standard WIFI: payload that iOS and Android cameras recognise to auto-connect.',
      'Supports WPA/WPA2, WEP and open (no password) networks, plus a hidden-network flag.',
      'Special characters in your SSID or password (such as ; , : " \\) are escaped automatically.',
      'Downloads a 512px PNG you can print for a guest room, cafe table or office wall.',
      'Runs entirely in your browser — your WiFi password is never uploaded.',
    ],
    steps: [
      {
        title: 'Enter the network details',
        body: 'Type your network name (SSID) exactly as it appears, then choose the security type — WPA/WPA2 for almost all modern routers — and enter the password. Tick "hidden network" only if your SSID is not broadcast.',
      },
      {
        title: 'Generate the QR code',
        body: 'Click "Generate" and the QR code appears on screen. Behind the scenes it encodes a string like WIFI:T:WPA;S:MyHome;P:hunter2;; that phone cameras understand.',
      },
      {
        title: 'Download and share',
        body: 'Tap "Download PNG" to save the 512px image. Print it for guests, or show it on a screen — anyone who scans it joins the network without typing the password.',
      },
    ],
    faqs: [
      {
        q: 'How does a phone connect from the QR code?',
        a: 'The code stores a WIFI: payload with the network name, security type and password. When a modern iPhone or Android camera scans it, the phone offers a "Join network" prompt and connects automatically — no manual typing.',
      },
      {
        q: 'Which security type should I pick?',
        a: 'Choose WPA/WPA2 for virtually all home and office routers. Pick WEP only for very old equipment, and "none" for an open network with no password. The wrong type can stop the auto-connect from working.',
      },
      {
        q: 'What is the hidden network option?',
        a: 'Tick it only if your router does not broadcast its SSID. It adds H:true; to the payload so the phone knows to look for a hidden network. For normal broadcast networks, leave it unchecked.',
      },
      {
        q: 'Is my WiFi password safe?',
        a: 'Yes. The QR code is generated locally in your browser and the password is never sent anywhere. Just remember the password is readable by anyone who scans or decodes the resulting image, so share the printout thoughtfully.',
      },
    ],
  },

  'remove-accents': {
    metaTitle: 'Remove Accents & Diacritics Online — café → cafe',
    metaDescription:
      'Strip accents and diacritics from text. café becomes cafe, naïve becomes naive, Zürich becomes Zurich. Great for slugs, usernames and search. Free, no signup.',
    intro:
      'This tool removes accents and diacritical marks from text while keeping the base letters. café becomes cafe, naïve becomes naive, and Łódź becomes Lodz. It uses Unicode NFD normalization to split each accented character into a base letter plus its mark, then strips the marks — handy for URL slugs, usernames and accent-insensitive search.',
    features: [
      'Strips diacritics from Latin text — à é î õ ü ñ ç all reduce to their base letters.',
      'Uses Unicode NFD normalization so it works across many languages, not just a fixed lookup table.',
      'Preserves spacing, punctuation and unaccented characters exactly as typed.',
      'Live output as you type, with one-click copy of the cleaned text.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Paste your text',
        body: 'Type or paste text with accents into the input box — for example "Café in Zürich serves crème brûlée".',
      },
      {
        title: 'Read the stripped output',
        body: 'The accent-free version appears instantly in the output box: "Cafe in Zurich serves creme brulee". Letters keep their shape; only the marks are removed.',
      },
      {
        title: 'Copy the result',
        body: 'Click "Copy" to grab the cleaned text — ready to use as a URL slug, a filename, or a value for accent-insensitive matching.',
      },
    ],
    faqs: [
      {
        q: 'How does the accent removal work?',
        a: 'It applies Unicode NFD normalization, which decomposes an accented character like é into the base letter e plus a separate combining acute accent, then deletes the combining marks (U+0300–U+036F). The base letters are left untouched.',
      },
      {
        q: 'Does it convert special letters like ß or ø?',
        a: 'Not always. Letters that are not a base letter plus a combining mark — such as German ß, Danish ø or Polish ł in some forms — may not decompose and can pass through unchanged. It targets diacritics rather than performing full transliteration.',
      },
      {
        q: 'Will it affect non-Latin scripts like Korean or Chinese?',
        a: 'It only removes combining diacritical marks, so CJK characters, Hangul and most other scripts pass through unchanged. It is designed for cleaning accented Latin text.',
      },
    ],
  },

  'json-flatten': {
    metaTitle: 'JSON Flatten & Unflatten — Dot Notation Keys, Free',
    metaDescription:
      'Flatten nested JSON to dot-notation keys and back. {"a":{"b":[1,2]}} becomes {"a.b.0":1,"a.b.1":2}. Reverse mode rebuilds the nested object. Free, no upload.',
    intro:
      'This tool flattens nested JSON into single-level keys using dot notation, and reverses it. Paste {"a": {"b": [1, 2]}} and flatten gives {"a.b.0": 1, "a.b.1": 2}; switch to unflatten and that same flat object rebuilds back into the nested structure. Array indices become numeric path segments.',
    features: [
      'Flatten mode collapses nested objects and arrays into dot-notation keys like user.address.city and items.0.name.',
      'Unflatten mode rebuilds the original nested object from dot-notation keys.',
      'Numeric segments are restored as array indices, so a.b.0 and a.b.1 become an array under a.b.',
      'Empty objects and arrays are preserved rather than dropped.',
      'Copy the output or download it as a .json file; runs entirely in your browser.',
    ],
    steps: [
      {
        title: 'Pick flatten or unflatten',
        body: 'Choose "Flatten" to collapse nested JSON into dot keys, or "Unflatten" to rebuild a nested object from flat keys. The placeholder text shows the expected input for each mode.',
      },
      {
        title: 'Paste your JSON',
        body: 'For flatten, paste something nested like {"a": {"b": [1, 2]}} — the output is {"a.b.0": 1, "a.b.1": 2}. For unflatten, paste a flat object like {"user.name": "kim", "user.age": 30}.',
      },
      {
        title: 'Copy or download',
        body: 'The converted JSON appears in the output box, pretty-printed. Click "Copy" to grab it, or "Download" to save it as flattened.json or unflattened.json.',
      },
    ],
    faqs: [
      {
        q: 'How are arrays handled when flattening?',
        a: 'Array items become numbered path segments. {"tags": ["a", "b"]} flattens to {"tags.0": "a", "tags.1": "b"}. On unflatten, any key segment that is a whole number (like 0 or 1) is rebuilt as an array index rather than an object key.',
      },
      {
        q: 'Is flatten then unflatten lossless?',
        a: 'For ordinary JSON, yes — round-tripping rebuilds the original structure. One ambiguity to watch: an object whose keys happen to be "0", "1", "2" will be reconstructed as an array, because numeric segments are treated as indices.',
      },
      {
        q: 'What happens to empty objects and arrays?',
        a: 'They are preserved as values. An empty object {} or empty array [] has nothing to expand into keys, so it is kept at its key (e.g. {"meta": {}}) rather than disappearing.',
      },
      {
        q: 'Why am I getting a JSON syntax error?',
        a: 'The input must be valid JSON. Common causes are trailing commas, single quotes instead of double quotes, or unquoted keys. For flatten the top level must be an object or array; for unflatten it must be a flat object of dot-notation keys.',
      },
    ],
  },

  'qr-code': {
    metaTitle: 'QR Code Generator & Reader — Free, No Signup',
    metaDescription:
      'Make a QR code from any URL or text, customize colors and error correction, then download a PNG. Or upload an image to decode the QR back to text. Free, no signup.',
    intro:
      'This tool both generates and reads QR codes. Type a URL like https://example.com or any text and it draws a scannable QR instantly; adjust the size, foreground/background color and error-correction level, then download a PNG. Switch to read mode and upload a photo or screenshot to decode the QR back into its original text.',
    features: [
      'Two modes: generate a QR from text/URL, or decode a QR out of an uploaded image.',
      'Four error-correction levels — L (~7%), M (~15%), Q (~25%), H (~30%) — higher levels survive more damage but pack more dots.',
      'Custom foreground and background colors plus an adjustable size from 128px to 1024px.',
      'Decoded URLs get a clickable "open link" shortcut, and any decoded text copies in one tap.',
      'Runs entirely in your browser — nothing you encode or scan is uploaded.',
    ],
    steps: [
      {
        title: 'Choose generate or read',
        body: 'Tap "QR generate" to build a code, or "QR read" to decode one. In generate mode, type the content — for example https://example.com or plain text like a Wi-Fi note.',
      },
      {
        title: 'Tune the options',
        body: 'Set the size (e.g. 512px), pick foreground/background colors, and choose an error-correction level. Use H (~30%) if you plan to print the code or place a logo over it; M (~15%) is fine for screens.',
      },
      {
        title: 'Download or decode',
        body: 'Click "Download PNG" to save the generated code. To read instead, drop in an image containing a QR — it decodes to text and, if the content is a URL, offers an "open link" shortcut.',
      },
    ],
    faqs: [
      {
        q: 'Is there a data limit on a QR code?',
        a: 'Yes. A QR code maxes out around 4,296 alphanumeric or 2,953 binary characters at the lowest error correction. In practice keep URLs and text short — the more you cram in, the denser the dots get, which makes the code harder to scan, especially when printed small.',
      },
      {
        q: 'Which error-correction level should I use?',
        a: 'L (~7%) holds the most data with the fewest dots and suits clean on-screen codes. M (~15%) is the common default. Use Q (~25%) or H (~30%) when the code may get smudged, printed small, or partly covered by a logo — they can still scan with damage.',
      },
      {
        q: 'Why won’t my uploaded image decode?',
        a: 'The decoder needs a reasonably sharp, well-lit QR. Blurry photos, heavy glare, extreme angles, or a code that fills only a tiny part of the frame often fail. Crop closer to the code and retry with a clearer image.',
      },
    ],
  },

  base64: {
    metaTitle: 'Base64 Encode / Decode — Text & Files, Data URI',
    metaDescription:
      'Encode text or any file to Base64 and decode it back. "Hi" becomes SGk=, and a file shows a data:URI you can paste into CSS or HTML. UTF-8 safe. Free, no upload.',
    intro:
      'This tool encodes and decodes Base64 for both text and files. Type "Hi" and it returns SGk=; paste Base64 back and it decodes to the original UTF-8 text. Drop in a file (image, PDF, anything) and it gives you the Base64 plus a ready-to-use data: URI for embedding in CSS or HTML.',
    features: [
      'Three modes: text → Base64, Base64 → text, and file → Base64.',
      'UTF-8 safe — encodes Korean, emoji and other multi-byte characters correctly, not just ASCII.',
      'File mode outputs both the raw Base64 and a data:<mime>;base64,… URI you can paste straight into an <img> or CSS background.',
      'Decode mode can save the result as a binary file when the Base64 is not text.',
      'Runs entirely in your browser — files and text are never uploaded.',
    ],
    steps: [
      {
        title: 'Pick a mode',
        body: 'Choose "text → Base64", "Base64 → text", or "file → Base64". The text modes share one input box; file mode shows a drop zone.',
      },
      {
        title: 'Enter your input',
        body: 'For encoding, type or paste text — "Hi" gives SGk=. For decoding, paste a Base64 string (whitespace and line breaks are ignored). For files, drop in any file to get its Base64 and data: URI.',
      },
      {
        title: 'Copy or save the result',
        body: 'Copy the output with one click. In file mode, grab the data:image/png;base64,… URI for an HTML/CSS embed; in decode mode, use "save binary" if the decoded bytes are not plain text.',
      },
    ],
    faqs: [
      {
        q: 'Why is the Base64 about 33% larger than the original?',
        a: 'Base64 encodes every 3 bytes as 4 ASCII characters, so output grows by roughly 4/3 — about 33% bigger. That overhead is the trade-off for representing arbitrary binary data using only safe text characters.',
      },
      {
        q: 'What is a data URI and when do I use one?',
        a: 'A data URI like data:image/png;base64,iVBOR… embeds the file’s bytes directly in HTML or CSS so no separate download is needed. It is handy for tiny icons or inlining small images, but for large files a normal URL is more efficient.',
      },
      {
        q: 'Does it handle non-English text and emoji?',
        a: 'Yes. The text is encoded as UTF-8 before Base64, so Korean, accented letters and emoji round-trip correctly. A common bug in naive btoa() code is breaking on such characters — this tool avoids it.',
      },
      {
        q: 'Is Base64 a form of encryption?',
        a: 'No. Base64 is reversible encoding, not encryption — anyone can decode it instantly with no key. Never use it to hide passwords or secrets; it only makes binary data safe to transport as text.',
      },
    ],
  },

  'json-format': {
    metaTitle: 'JSON Formatter & Validator — Pretty Print / Minify',
    metaDescription:
      'Format, minify and validate JSON in your browser. Pretty-print with 2 or 4 spaces, collapse to one line, and catch syntax errors with a clear message. Free, no signup.',
    intro:
      'This JSON formatter pretty-prints, minifies and validates JSON as you type. Paste {"hello":"world","items":[1,2,3]} and it indents it cleanly with 2 or 4 spaces; switch to minify and it collapses to a single line. Invalid JSON is flagged immediately with the parser’s error message, and you get size and key-count stats.',
    features: [
      'Pretty-print with a choice of 2 or 4 space indentation, or minify to a single compact line.',
      'Live validation — a green "valid JSON" check or the exact parser error (e.g. "Unexpected token } in JSON") as you type.',
      'Shows input size, output size and total key count so you can see how much minifying saves.',
      'Copy the formatted output or download it as a .json file.',
      'Runs entirely in your browser with no signup or upload.',
    ],
    steps: [
      {
        title: 'Paste your JSON',
        body: 'Drop your JSON into the input — for example {"hello":"world","items":[1,2,3]}. A built-in sample button loads example data if you just want to try it.',
      },
      {
        title: 'Pick pretty-print or minify',
        body: 'Choose "format" to indent with 2 or 4 spaces, or "minify" to strip all whitespace into one line. The output and the size stats update instantly.',
      },
      {
        title: 'Copy or download',
        body: 'Use "Copy" to grab the result, or "Download .json" to save it as formatted.json. If the input is invalid, fix the spot shown in the red error message first.',
      },
    ],
    faqs: [
      {
        q: 'Does formatting change my data?',
        a: 'No. Pretty-print and minify only add or remove whitespace — the keys, values, order and structure are identical. Minifying just removes spaces and line breaks to shrink the file for transport.',
      },
      {
        q: 'Why does it say my JSON is invalid?',
        a: 'The most common causes are trailing commas, single quotes instead of double quotes, unquoted keys, or a missing bracket. The red error message reports what the parser expected — fix that spot and the green "valid" check returns.',
      },
      {
        q: 'How much smaller does minifying make a file?',
        a: 'It depends on indentation, but removing the whitespace from a pretty-printed file typically cuts 20–50% of the bytes. The tool shows input size versus output size so you can see the exact reduction.',
      },
    ],
  },

  'password-gen': {
    metaTitle: 'Secure Password Generator — Strong Random + Strength',
    metaDescription:
      'Generate strong random passwords with crypto-grade randomness. A 20-char password with symbols scores ~120 bits of entropy. Set length, character sets, bulk count. Free.',
    intro:
      'This password generator creates strong, random passwords using the Web Crypto API (crypto.getRandomValues), not Math.random. Set the length and which character sets to include, and it generates a batch at once with a live strength meter — a 20-character password with symbols lands around 120 bits of entropy and rates "very strong".',
    features: [
      'Crypto-grade randomness via crypto.getRandomValues — unpredictable, unlike Math.random.',
      'Toggle lowercase, uppercase, digits and symbols, and set length from 6 to 64 characters.',
      'Optional "exclude ambiguous characters" removes look-alikes like I, l, 1, O and 0.',
      'Generates up to 100 passwords at once, each with an entropy-bit strength rating.',
      'Runs entirely in your browser — generated passwords are never sent anywhere.',
    ],
    steps: [
      {
        title: 'Set length and character sets',
        body: 'Drag the length slider (20 is a solid default) and tick the sets you want — lowercase, uppercase, digits and symbols. Including all four maximizes strength per character.',
      },
      {
        title: 'Generate a batch',
        body: 'Choose how many to create (e.g. 5) and click "Generate". Each password shows a strength bar and its entropy in bits — aim for "strong" (70+ bits) or higher.',
      },
      {
        title: 'Copy the one you want',
        body: 'Tap the copy icon next to any password to put it on your clipboard. Optionally enable "exclude ambiguous characters" first so you never confuse l and 1 when typing it.',
      },
    ],
    faqs: [
      {
        q: 'How random are these passwords?',
        a: 'They use crypto.getRandomValues, the browser’s cryptographically secure random source — the same class of randomness used for keys and tokens. This is far stronger than Math.random, which is predictable and unsuitable for passwords.',
      },
      {
        q: 'How long should my password be?',
        a: 'Length matters more than complexity. With all character sets on, 16 characters gives roughly 100 bits of entropy and 20 characters around 120 bits — both well beyond what brute force can crack. The tool rates anything 16+ with symbols as strong.',
      },
      {
        q: 'What does the entropy "bits" number mean?',
        a: 'Entropy estimates how hard the password is to guess: each extra bit doubles the number of possibilities. Under ~50 bits is weak, 70+ is strong, and 90+ is very strong. Adding length or more character types raises the bits.',
      },
      {
        q: 'Are the passwords stored or logged?',
        a: 'No. They are generated locally and held only in the page. Refreshing or closing the tab discards them, and nothing is transmitted — so copy the one you need before leaving.',
      },
    ],
  },

  'uuid-gen': {
    metaTitle: 'UUID Generator (v4) — Single & Bulk, Free Online',
    metaDescription:
      'Generate random UUID v4 identifiers like 3f50…-… in bulk. Make one or up to 10,000 at once, choose uppercase, no-hyphen or {braces} format, copy or download as TXT. Free.',
    intro:
      'This tool generates version 4 (random) UUIDs using crypto.randomUUID. Make a single identifier or up to 10,000 at once, then format them as standard lowercase, uppercase, hyphen-free, or wrapped in {braces}. Copy one, copy all, or download the whole list as a .txt file.',
    features: [
      'Generates UUID v4 using the browser’s crypto.randomUUID (cryptographically random), with a getRandomValues fallback.',
      'Bulk mode produces 1 to 10,000 UUIDs in one click — handy for seeding test data.',
      'Four output formats: default lowercase, UPPERCASE, no-hyphen (32 chars), and {braced}.',
      'Copy a single UUID, copy the whole list, or download it as uuids.txt.',
      'Runs entirely in your browser — no signup or upload.',
    ],
    steps: [
      {
        title: 'Set the count',
        body: 'Enter how many UUIDs you need — 1 for a single id, or up to 10,000 for a bulk batch of test data.',
      },
      {
        title: 'Choose a format',
        body: 'Pick default (lowercase like 3f50a1c2-…-…), UPPERCASE, no-hyphen (32 hex chars), or {braces}. The whole list re-renders in that format instantly.',
      },
      {
        title: 'Copy or download',
        body: 'Use the copy icon on any row, "copy all" to grab the full newline-separated list, or "TXT" to download it as uuids.txt for importing elsewhere.',
      },
    ],
    faqs: [
      {
        q: 'What is a UUID v4?',
        a: 'A version 4 UUID is a 128-bit identifier whose bits are almost entirely random, formatted as 8-4-4-4-12 hex digits (e.g. 3f50a1c2-9b7e-4d3a-b8f1-2c6e0a1d4e5f). The "4" in the third group marks the version.',
      },
      {
        q: 'Can two generated UUIDs collide?',
        a: 'In practice, no. With 122 random bits the odds of a collision are astronomically small — you would need to generate billions of UUIDs before a clash became remotely likely, which is why they are used as globally unique keys without coordination.',
      },
      {
        q: 'What is the difference between UUID v4 and v1?',
        a: 'v1 is derived from the timestamp and MAC address, so it leaks when and (partly) where it was made and is roughly sortable. v4 is purely random, leaks nothing, and is the right default for database keys and tokens. This tool generates v4.',
      },
    ],
  },

  'jwt-decoder': {
    metaTitle: 'JWT Decoder — Inspect Header, Payload, Signature',
    metaDescription:
      'Decode a JWT into its header, payload and signature. See claims like sub, iat and exp in plain JSON, with expiry status. Does NOT verify the signature. Free, no upload.',
    intro:
      'This JWT decoder splits a token into its three dot-separated parts — header, payload and signature — and shows the header and payload as readable JSON. It decodes the Base64URL segments, displays standard claims (sub, iat, exp, nbf) with human-readable timestamps, and flags whether the token is expired. A "Bearer " prefix is stripped automatically.',
    features: [
      'Splits the JWT at its two dots into header.payload.signature and decodes each Base64URL segment.',
      'Pretty-prints the header and payload JSON, and copies each section independently.',
      'Interprets time claims — iat, exp and nbf are shown as UTC timestamps, and exp drives a valid/expired badge.',
      'Accepts a raw token or one with a "Bearer " prefix.',
      'Runs entirely in your browser — the token is decoded locally and never sent to a server.',
    ],
    steps: [
      {
        title: 'Paste the token',
        body: 'Paste your JWT (with or without a leading "Bearer "). A valid token has exactly three parts separated by dots — header.payload.signature — like eyJhbGci…​.eyJzdWIi…​.dQw4w9.',
      },
      {
        title: 'Read the header and payload',
        body: 'The header shows the algorithm (e.g. {"alg":"HS256","typ":"JWT"}) and the payload shows the claims as JSON. Time claims such as exp are rendered as a readable UTC time, with a valid or expired badge.',
      },
      {
        title: 'Copy what you need',
        body: 'Use the copy button on the header, payload or signature to grab just that piece. The signature is shown as-is — it is not checked (see below).',
      },
    ],
    faqs: [
      {
        q: 'Does decoding verify the signature?',
        a: 'No. This tool only decodes and displays the token — it does NOT verify the signature. Verification requires the secret or public key, which lives on your server. Never trust a JWT’s contents based on decoding alone; always verify it server-side.',
      },
      {
        q: 'Is it safe to paste a real token here?',
        a: 'The decoding happens entirely in your browser and nothing is uploaded. Still, a JWT is a credential — anyone who sees it can act as you until it expires — so avoid pasting production tokens into any tool you don’t control, and prefer expired or test tokens.',
      },
      {
        q: 'What do the sub, iat and exp claims mean?',
        a: 'sub is the subject (usually the user id), iat is "issued at" (when the token was created), exp is the expiry time, and nbf is "not before" (when it becomes valid). iat/exp/nbf are Unix timestamps, which this tool converts to readable UTC times.',
      },
      {
        q: 'Why is the payload readable without a key?',
        a: 'A JWT payload is only Base64URL-encoded, not encrypted, so anyone can read it. The signature does not hide the data — it only proves the token has not been tampered with. Never put secrets in a JWT payload.',
      },
    ],
  },

  'url-encoder': {
    metaTitle: 'URL Encoder / Decoder & Parser — Query Params',
    metaDescription:
      'Encode or decode URLs and analyze their parts. A space becomes %20, "안녕" becomes %EC%95%88…, and parse mode breaks a URL into host, path and query params. Free, no signup.',
    intro:
      'This tool encodes, decodes and analyzes URLs. Encode mode turns special characters into percent-escapes (a space becomes %20, "안녕" becomes %EC%95%88%EB%85%95); decode mode reverses it; and parse mode breaks a full URL into protocol, host, path, query and hash, listing every query parameter as a key/value pair.',
    features: [
      'Three modes: encode, decode, and parse (analyze the URL’s components).',
      'Choose encodeURIComponent (recommended for query values, escapes & = ? #) or encodeURI (preserves URL structure).',
      'Parse mode lists protocol, hostname, port, path, query string and hash, plus each query parameter split out.',
      'Handles non-ASCII text — Korean and emoji encode to UTF-8 percent-escapes correctly.',
      'Runs entirely in your browser with one-click copy of any field.',
    ],
    steps: [
      {
        title: 'Pick a mode',
        body: 'Choose "encode", "decode", or "parse". For encode/decode, the "Component" checkbox controls whether reserved characters like & and ? are escaped — leave it on for query values.',
      },
      {
        title: 'Enter the URL or text',
        body: 'Paste your input — e.g. https://example.com/search?q=안녕 세상&page=2. Encoding turns the space into %20 and the Korean into %EC%95%88…; parse mode breaks it into host, path and query parts.',
      },
      {
        title: 'Read and copy the result',
        body: 'For encode/decode, copy the single output. In parse mode, each component and each query parameter (q = "안녕 세상", page = "2") has its own copy button.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between encodeURIComponent and encodeURI?',
        a: 'encodeURIComponent escapes everything that isn’t safe in a single value — including & = ? # / — so it’s right for query parameter values. encodeURI keeps those structural characters intact, so it’s for encoding a whole URL. The "Component" checkbox switches between them.',
      },
      {
        q: 'Why does a space become %20 (or sometimes +)?',
        a: 'In a URL path and with percent-encoding a space is %20. The + form for spaces is specific to application/x-www-form-urlencoded query strings. This tool uses standard percent-encoding, so spaces show as %20.',
      },
      {
        q: 'How is non-English text encoded?',
        a: 'Characters outside ASCII are first encoded as UTF-8 bytes, then each byte becomes a %XX escape. So "안녕" becomes %EC%95%88%EB%85%95 — three bytes per Hangul character. Decoding reverses this back to the original text.',
      },
    ],
  },

  'regex-tester': {
    metaTitle: 'Regex Tester — Live Matches, Groups & Replace',
    metaDescription:
      'Test a regular expression live against your text. See highlighted matches, capture groups and match index, toggle g/i/m/s/u flags, and preview replacements. Free, no signup.',
    intro:
      'This regex tester evaluates a JavaScript regular expression against your sample text live as you type. It highlights every match in context, lists each match with its index and capture groups, and lets you toggle the g/i/m/s/u flags. A replace box previews the result with $1, $2 group references, and built-in presets cover email, URL, IPv4 and dates.',
    features: [
      'Live highlighting of all matches in the test string, with a running match count.',
      'Per-match detail: the matched text, its index, and any capture groups.',
      'Toggle the g, i, m, s and u flags individually and watch results update.',
      'Replace preview supporting $1/$2 group back-references, plus presets for email, URL, phone, IPv4 and YYYY-MM-DD.',
      'Runs entirely in your browser; large inputs (over 100,000 chars) pause live eval to avoid freezing the tab.',
    ],
    steps: [
      {
        title: 'Enter a pattern and flags',
        body: 'Type your regex in the pattern box — for example \\b\\w+@\\w+\\.\\w+\\b for emails — and toggle flags like g (global) and i (case-insensitive). Or click a preset such as "Email" to load one.',
      },
      {
        title: 'Paste your test string',
        body: 'Put the text to search in the test box. Matches are highlighted inline and listed below with their index and capture groups, e.g. alice@example.com at index 4.',
      },
      {
        title: 'Preview a replacement',
        body: 'Type a replacement in the replace box — use $1, $2 to reference capture groups — and the bottom panel shows the substituted text. Copy whichever result you need.',
      },
    ],
    faqs: [
      {
        q: 'Which regex dialect does this use?',
        a: 'It uses the JavaScript (ECMAScript) regular-expression engine — the same one in browsers and Node. Syntax differs from PCRE/Python in places (e.g. no inline (?i) flags; named groups use (?<name>…)), so test here matches how it will behave in JS.',
      },
      {
        q: 'What do the g, i, m, s and u flags do?',
        a: 'g finds all matches (not just the first), i is case-insensitive, m makes ^ and $ match line starts/ends, s lets . match newlines (dotall), and u enables full Unicode handling. Toggle each and the match list updates.',
      },
      {
        q: 'How do capture groups and replacement references work?',
        a: 'Parentheses ( ) create capture groups, shown per match in the results. In the replace box you reference them with $1, $2, etc. — so a pattern (\\w+)@(\\w+) with replacement $2-$1 swaps the two halves.',
      },
      {
        q: 'Why did live matching stop on a big input?',
        a: 'A complex regex on a very large string can cause catastrophic backtracking that freezes the tab, so live evaluation pauses past about 100,000 characters. You can opt in to "run anyway", but simplify the pattern first if it hangs.',
      },
    ],
  },

  'text-diff': {
    metaTitle: 'Text Diff Tool — Compare Two Texts Line by Line',
    metaDescription:
      'Compare two blocks of text and see what changed. Added lines highlight green, removed lines red, with line/word/character diff modes and +/− counts. Free, no signup.',
    intro:
      'This text diff tool compares two versions side by side and highlights the differences. Added content shows in green, removed in red, and you can diff by line, word or character. A running tally shows how many lines were added, removed and unchanged — useful for reviewing edits, config changes or document revisions.',
    features: [
      'Three granularities: line-by-line, word-by-word, or character-by-character diff.',
      'Color-coded output — green for additions, red strike-through for removals, plain for unchanged.',
      'Live +/−/= counts so you see at a glance how much changed.',
      'Side-by-side input boxes for the original (A) and revised (B) text.',
      'Runs entirely in your browser — your text is never uploaded.',
    ],
    steps: [
      {
        title: 'Paste the two versions',
        body: 'Put the original in the "A" box and the revised text in the "B" box — for example two versions of a config file or a paragraph you edited.',
      },
      {
        title: 'Choose the diff unit',
        body: 'Pick line, word or character mode. Line mode is best for code and lists; word mode is better for prose where you tweaked a few words within a line.',
      },
      {
        title: 'Read the highlighted result',
        body: 'The diff panel shows additions in green and removals in red strike-through, with a +12 / −3 / =40 summary so you know exactly what changed.',
      },
    ],
    faqs: [
      {
        q: 'When should I use line vs word vs character diff?',
        a: 'Use line diff for code, logs and structured lists — it shows whole changed lines. Use word diff for prose where you changed a few words inside a sentence. Character diff is the most granular, good for spotting a single typo or a changed digit.',
      },
      {
        q: 'Does it ignore whitespace or line-ending differences?',
        a: 'No. The diff is exact, so trailing spaces, tabs vs spaces, and different line endings count as changes. If a line shows as changed but looks identical, an invisible whitespace difference is usually the cause.',
      },
      {
        q: 'Can it handle large files?',
        a: 'It works for typical documents and code files, but character and word diffs are O(n×m), so very large inputs get slow. The comparison is deferred slightly so typing stays responsive; for huge files, line mode is fastest.',
      },
    ],
  },

  'text-count': {
    metaTitle: 'Word & Character Counter — Live Counts, Reading Time',
    metaDescription:
      'Count words, characters, lines, sentences and UTF-8 bytes live as you type. See reading time at 200 wpm, plus Korean/English/digit breakdown and top word frequency. Free.',
    intro:
      'This counter tallies your text in real time: characters (with and without spaces), words, lines, paragraphs, sentences and UTF-8 byte size. It also estimates reading time at 200 words per minute, breaks down Korean vs English vs digit characters, and lists your most frequent words — handy for essays, social posts and SEO snippets.',
    features: [
      'Live counts of characters, characters without spaces, words, lines, paragraphs and sentences.',
      'UTF-8 byte size — useful for database fields and meta-description limits, where a Korean character is 3 bytes.',
      'Reading-time estimate at 200 wpm, plus average word length.',
      'Character breakdown by script (Korean / English / digits) and a top-10 word frequency chart.',
      'Runs entirely in your browser; counts update instantly, even on large pastes.',
    ],
    steps: [
      {
        title: 'Type or paste your text',
        body: 'Drop your text into the box — an essay, a tweet draft, or a meta description you’re trimming. Counting starts immediately, no button needed.',
      },
      {
        title: 'Read the live statistics',
        body: 'The stats grid updates as you type: characters, words, lines, sentences and UTF-8 bytes, plus an estimated reading time like "about 3 min" at 200 wpm.',
      },
      {
        title: 'Check the breakdowns',
        body: 'Below the stats, see how many Korean, English and digit characters there are, and a top-10 word frequency chart to spot repetition.',
      },
    ],
    faqs: [
      {
        q: 'How is a "word" counted?',
        a: 'Words are runs of non-whitespace separated by spaces, tabs or line breaks. This matches how most word counters work for English. Note that for languages without spaces (like Chinese), the character count is the more meaningful figure.',
      },
      {
        q: 'Why does the byte count differ from the character count?',
        a: 'Bytes are measured in UTF-8, where ASCII letters are 1 byte but a Korean or emoji character is 3–4 bytes. So "안녕" is 2 characters but 6 bytes. This matters for byte-limited fields and meta tags.',
      },
      {
        q: 'How is reading time calculated?',
        a: 'It divides the word count by 200 words per minute, a common average adult reading speed, and rounds up. A 600-word article shows roughly 3 minutes. It’s an estimate — technical text reads slower, light text faster.',
      },
    ],
  },

  'pdf-merge': {
    metaTitle: 'Merge PDF Files Online — Combine PDFs Free, No Upload',
    metaDescription:
      'Combine multiple PDFs into one in your browser. Drag to reorder pages, or pick a folder to auto-sort by name (so 2.pdf comes before 10.pdf). No upload, free, no signup.',
    intro:
      'This tool merges several PDF files into a single document, entirely in your browser. Add files and drag them into the order you want — the pages are stitched together top to bottom — or point it at a folder and it auto-sorts naturally so 2.pdf comes before 10.pdf. The combined PDF downloads directly; nothing is uploaded.',
    features: [
      'Combine any number of PDFs; the final order follows your arrangement.',
      'Reorder files by dragging, or with up/down buttons, before merging.',
      'Folder mode auto-sorts with natural numeric ordering (2.pdf before 10.pdf) and previews the merge order.',
      'Reports the total page count of the merged result.',
      'Runs entirely in your browser — your PDFs are never uploaded to a server.',
    ],
    steps: [
      {
        title: 'Add your PDFs',
        body: 'Drop in two or more PDF files, or switch to folder mode to pull in every PDF from a folder. You need at least 2 files to merge.',
      },
      {
        title: 'Set the order',
        body: 'Drag the rows (or use the ↑↓ buttons) to arrange the files — the merged document follows this top-to-bottom order. In folder mode, pick a sort like "name (natural)" so 2.pdf lands before 10.pdf.',
      },
      {
        title: 'Merge and download',
        body: 'Click "Merge PDF". The combined file is built locally and offered for download, with the total page count shown — e.g. "30 pages combined".',
      },
    ],
    faqs: [
      {
        q: 'Are my PDFs uploaded anywhere?',
        a: 'No. The merge is done with pdf-lib directly in your browser, so the files never leave your device — which makes it safe for contracts, statements and other sensitive documents. You can confirm in the Network tab that nothing is sent.',
      },
      {
        q: 'How do I control the order of the merged pages?',
        a: 'In file mode, drag the rows or use the up/down buttons; the merged PDF follows that order. In folder mode, choose a sort option — "natural" handles numbered files correctly (page 2 before page 10), and a preview shows the exact order before you merge.',
      },
      {
        q: 'Can it merge password-protected PDFs?',
        a: 'An encrypted PDF must be unlocked first — you’ll need to remove the password before merging. Once a PDF opens without a password, it can be combined like any other file.',
      },
      {
        q: 'Is there a limit on file count or size?',
        a: 'There’s no hard file-count limit, but everything is processed in your browser’s memory, so very large or numerous PDFs (hundreds of MB total) can get slow or run out of memory. For big jobs, merge in smaller batches.',
      },
    ],
  },

  'pdf-split': {
    metaTitle: 'Split PDF Online — By Page Ranges, Free, No Upload',
    metaDescription:
      'Split a PDF by page ranges, every N pages, or one page each. Enter 1-3, 4-6 to get two PDFs, or burst a 10-page file into 10 files. Downloads as a ZIP. Free, no upload.',
    intro:
      'This tool splits one PDF into several, entirely in your browser. Type ranges like 1-3, 4-6 to carve out independent PDFs, choose "every N pages" for even chunks, or "each page" to burst the file into one PDF per page. A single output downloads directly; multiple outputs are bundled into a ZIP.',
    features: [
      'Three split modes: custom page ranges, every N pages, or one PDF per page.',
      'Range mode treats each comma-separated segment as its own output — 1-3, 4-6 yields two PDFs.',
      'Auto-detects the page count and pre-fills the full range when you load a file.',
      'Single result downloads as a PDF; multiple results are zipped into one download.',
      'Runs entirely in your browser — your PDF is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload the PDF',
        body: 'Drop in a single PDF. The tool reads its page count (say 12 pages) and pre-fills the range field as 1-12.',
      },
      {
        title: 'Choose how to split',
        body: 'Pick "ranges" and type something like 1-3, 4-6, 7 to make three files; or "every N pages" to chunk evenly; or "each page" to get one PDF per page (12 files for a 12-page document).',
      },
      {
        title: 'Run and download',
        body: 'Click "Split". One output downloads as a single PDF; several outputs come back as a ZIP — named like document-split.zip with each part inside.',
      },
    ],
    faqs: [
      {
        q: 'How do I write the page ranges?',
        a: 'Use comma-separated segments where each becomes its own PDF. 1-3, 4-6 produces two files (pages 1–3 and 4–6). A single number like 7 extracts just that page. Pages are 1-based and must be within the document’s page count.',
      },
      {
        q: 'When do I get a ZIP versus a single PDF?',
        a: 'If the split produces one output (one range), it downloads as a plain PDF. If it produces multiple outputs (several ranges, every-N, or each-page), they’re bundled into a single ZIP so you don’t get a flurry of separate downloads.',
      },
      {
        q: 'Is my file uploaded to split it?',
        a: 'No. The split runs locally with pdf-lib in your browser, so the PDF stays on your device — safe for confidential documents. Files up to about 100 MB are supported, subject to your browser’s memory.',
      },
    ],
  },

  'image-resize': {
    metaTitle: 'Resize Image Online — By Pixels, Percent or Target KB',
    metaDescription:
      'Resize images by exact pixels, by percentage, or to a target file size in KB. Use presets like 1080×1080 or 1280×720, keep aspect ratio, batch a whole folder. Free, no upload.',
    intro:
      'This image resizer changes dimensions three ways: exact pixels (e.g. 1920×1080), a percentage of the original, or a target file size in KB where it auto-tunes quality and dimensions to hit your number. It keeps aspect ratio by default, includes presets for Instagram, YouTube and OG sizes, and can batch-resize an entire folder.',
    features: [
      'Three modes: pixel dimensions, percentage scale, or target file size in KB (auto-optimized).',
      'One-tap presets — Instagram 1080×1080, story 1080×1920, YouTube thumbnail 1280×720, OG 1200×630.',
      'Keep-aspect-ratio toggle so width and height stay proportional.',
      'Output as JPEG, PNG, WebP or AVIF with a quality slider, and batch a whole folder to a ZIP.',
      'Runs entirely in your browser — images are never uploaded.',
    ],
    steps: [
      {
        title: 'Upload an image (or a folder)',
        body: 'Drop in one image, or switch to folder mode to resize many at once. The tool reads the original dimensions, e.g. 4000×3000.',
      },
      {
        title: 'Pick a resize mode',
        body: 'Choose "pixels" and type 1920×1080 (or tap a preset like 1080×1080); or "percent" to scale to, say, 50%; or "target KB" to auto-fit under, e.g., 200 KB. Keep "maintain aspect ratio" on to avoid stretching.',
      },
      {
        title: 'Set format and download',
        body: 'Pick an output format (WebP often saves the most) and quality, then run. The result shows the new size and dimensions; folder jobs download as a ZIP.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between resizing and compressing?',
        a: 'Resizing changes the pixel dimensions (e.g. 4000×3000 → 1920×1080), which usually shrinks the file too. Compressing keeps the dimensions but lowers quality to reduce bytes. The "target KB" mode here combines both — it lowers quality first, then dimensions, to hit your size.',
      },
      {
        q: 'Will resizing make my image blurry?',
        a: 'Shrinking an image (downscaling) keeps it sharp. Enlarging it past its original pixels (upscaling) interpolates new pixels and looks soft, since no extra detail exists. For crisp results, resize down rather than up.',
      },
      {
        q: 'Which output format should I choose?',
        a: 'WebP typically cuts size 25–35% versus JPEG at similar quality and supports transparency. JPEG is the most compatible for photos, PNG is best for graphics with sharp edges or transparency, and AVIF compresses smallest but isn’t supported everywhere.',
      },
      {
        q: 'Are the images uploaded to a server?',
        a: 'No. Resizing uses the Canvas API in your browser, so the images stay on your device — nothing is uploaded, even in folder batch mode.',
      },
    ],
  },

  'image-convert': {
    metaTitle: 'Image Converter — JPG, PNG, WebP, AVIF (Batch)',
    metaDescription:
      'Convert images between JPG, PNG, WebP and AVIF in your browser. Switch a folder of PNGs to WebP to cut size 25–35%, with a quality slider. Multi-file batch to ZIP. Free.',
    intro:
      'This image converter changes format between JPG, PNG, WebP and AVIF with a quality slider. Convert a single image or drop a whole folder — converting PNGs to WebP typically trims 25–35% off the file size. Multiple files come back as a ZIP, and AVIF is offered only when your browser can encode it.',
    features: [
      'Convert between JPEG, PNG, WebP and AVIF, with a quality slider for the lossy formats.',
      'Multi-file and folder batch — converts many images at once and bundles them into a ZIP.',
      'Detects AVIF encoding support and disables it gracefully when the browser can’t do it.',
      'Shows the resulting size so you can see the savings from a format switch.',
      'Runs entirely in your browser — images are never uploaded.',
    ],
    steps: [
      {
        title: 'Add images',
        body: 'Drop one or several images, or switch to folder mode for a whole directory. JPG, PNG, WebP, AVIF, BMP and GIF inputs are accepted.',
      },
      {
        title: 'Choose the output format',
        body: 'Pick the target — WebP for a good size/quality balance, PNG for lossless graphics, AVIF for the smallest files (if supported). For lossy formats, set the quality (85% is a sensible default).',
      },
      {
        title: 'Convert and download',
        body: 'Click "Convert to WEBP" (or your chosen format). A single image downloads directly; multiple images download as a ZIP like converted-webp.zip.',
      },
    ],
    faqs: [
      {
        q: 'AVIF vs WebP — which should I pick?',
        a: 'AVIF usually compresses smaller than WebP at the same quality, especially for photos, but it encodes slower and isn’t supported in every browser (this tool disables it when yours can’t encode it). WebP is faster, near-universally supported now, and still beats JPEG — a safe default. Use AVIF when you need the absolute smallest files.',
      },
      {
        q: 'Does converting PNG to JPG lose quality?',
        a: 'JPEG is lossy and doesn’t support transparency, so a PNG with a transparent background gets a solid background and some compression artifacts. For photos that’s usually fine; for logos, screenshots or images with transparency, keep PNG or use WebP, which is lossy-or-lossless and keeps transparency.',
      },
      {
        q: 'How much smaller is WebP than JPEG?',
        a: 'At comparable visual quality, WebP is typically 25–35% smaller than JPEG, and it also supports transparency and animation. The tool shows the output size so you can confirm the saving for your specific images.',
      },
      {
        q: 'Are the images uploaded for conversion?',
        a: 'No. Conversion uses the Canvas API locally in your browser, so your images never leave your device — including folder and multi-file batches.',
      },
    ],
  },

  'image-heic-to-jpg': {
    metaTitle: 'HEIC to JPG Converter — iPhone Photos, Free, No Upload',
    metaDescription:
      'Convert iPhone HEIC/HEIF photos to JPG or PNG in your browser. Set JPEG quality, convert one photo or a whole folder to a ZIP. No upload, free, no signup.',
    intro:
      'This tool converts iPhone HEIC/HEIF photos to JPG or PNG so they open everywhere — Windows, older apps, websites and editors that don’t support HEIC. Convert a single photo or a whole folder; for JPEG you can set the quality, and folder batches download as a ZIP. Everything runs in your browser.',
    features: [
      'Converts .heic and .heif (Apple’s photo format) to widely-supported JPG or PNG.',
      'Adjustable JPEG quality, or lossless PNG output.',
      'Single-photo or whole-folder batch — folder results come back as a ZIP.',
      'Decodes locally with the heic2any library; processes one at a time to manage memory.',
      'Runs entirely in your browser — your photos are never uploaded.',
    ],
    steps: [
      {
        title: 'Add your HEIC photos',
        body: 'Drop in a .heic/.heif file from your iPhone, or switch to folder mode to convert every HEIC in a folder at once.',
      },
      {
        title: 'Choose format and quality',
        body: 'Pick JPG (best for sharing, with a quality slider — 90% is a good default) or PNG (lossless, larger). For a folder, the same setting applies to every photo.',
      },
      {
        title: 'Convert and save',
        body: 'Click "Convert". A single photo gives you a JPG/PNG to download; a folder produces a ZIP of converted images, keeping the original file names.',
      },
    ],
    faqs: [
      {
        q: 'Why won’t HEIC photos open on Windows?',
        a: 'HEIC (High Efficiency Image Format) is Apple’s default and Windows doesn’t fully support it without extra codecs, so many apps and websites can’t open it. Converting to JPG or PNG makes the photos open everywhere, which is why this tool exists.',
      },
      {
        q: 'Does converting HEIC to JPG lose quality?',
        a: 'JPEG is lossy, so there is some quality loss versus the HEIC original — but at 90%+ quality it’s visually negligible for normal viewing and sharing. Choose PNG if you want a lossless result, though the files will be much larger.',
      },
      {
        q: 'Why is the JPG larger than the original HEIC?',
        a: 'HEIC compresses more efficiently than JPEG — it’s roughly half the size for similar quality. So a converted JPG (and especially a PNG) is often bigger than the HEIC it came from. That’s the trade-off for universal compatibility.',
      },
      {
        q: 'Are my photos uploaded to convert them?',
        a: 'No. Decoding and conversion happen entirely in your browser with the heic2any library, so your photos never leave your device — safe for personal pictures. Folder batches are processed one at a time to keep memory in check.',
      },
    ],
  },

  'unit-converter': {
    metaTitle: 'Unit Converter — Length, Weight, Temperature & More',
    metaDescription:
      'Convert length, weight, temperature, area, speed and volume. 1 m shows cm, in, ft and mi at once; 100°F = 37.78°C; 1 pyeong = 3.31 m². Free, instant, no signup.',
    intro:
      'This unit converter handles six categories — length, weight, temperature, area, speed and volume. Enter a value in one unit and it shows every other unit in that category at once: type 1 m and you instantly get 100 cm, 39.37 in and 0.000621 mi; switch to temperature and 100°F resolves to 37.78°C and 310.15 K.',
    features: [
      'Six categories: length, weight, temperature, area, speed and volume.',
      'One-to-many — enter one value and see all the other units in the category at the same time.',
      'Includes regional units like 평 (pyeong = 3.3058 m²) and knots, alongside metric and imperial.',
      'Handles temperature correctly with the proper offset formulas (not just a ratio).',
      'Copy any single converted value, and everything recalculates live in your browser.',
    ],
    steps: [
      {
        title: 'Pick a category',
        body: 'Tap a category chip — length, weight, temperature, area, speed or volume. The available units switch to match (m, kg, °C, m², km/h, L, and so on).',
      },
      {
        title: 'Enter a value and its unit',
        body: 'Type the number and choose the source unit, e.g. 1 with "m" selected. Every other unit updates instantly — 100 cm, 39.37 in, 3.28 ft, 0.000621 mi.',
      },
      {
        title: 'Copy the result you need',
        body: 'Each converted row has a copy button — grab just the value you want, like "37.78" when converting 100°F to Celsius.',
      },
    ],
    faqs: [
      {
        q: 'How do I convert Fahrenheit to Celsius here?',
        a: 'Select the temperature category, enter the value with °F selected, and read the °C row. The tool uses the real formula (°C = (°F − 32) × 5/9), so 100°F correctly gives 37.78°C — not a simple ratio, which is a common mistake with temperature.',
      },
      {
        q: 'What is a 평 (pyeong) and how does it convert?',
        a: 'Pyeong is a traditional Korean unit of area, equal to about 3.3058 m². It’s included in the area category, so 1 pyeong shows as 3.31 m² (≈ 35.6 ft²) — handy for real-estate sizes in Korea.',
      },
      {
        q: 'How precise are the conversions?',
        a: 'Conversions use standard factors (e.g. 1 inch = 0.0254 m, 1 lb = 453.592 g) and display up to 6 significant digits, switching to scientific notation for very large or tiny results so you don’t lose precision.',
      },
    ],
  },

  percentage: {
    metaTitle: 'Percentage Calculator — Discount, Tip, % Change & More',
    metaDescription:
      'Six percentage modes in one: X% of a number, what % one value is of another, percent change, add/subtract a %, tip/VAT, and ratio. 15% of 200,000 = 30,000. Free, no signup.',
    intro:
      'This percentage calculator covers six common tasks in one place: X% of a number, what percent one value is of another, percent change between two numbers, adding or subtracting a percentage, a tip/VAT add-on, and splitting a ratio into percentages. Enter two numbers and the answer appears instantly — 15% of 200,000 is 30,000.',
    features: [
      'Six modes: % of a value, value-as-percent, percent change, add/subtract %, tip/VAT, and ratio.',
      'Add/subtract mode shows both the +X% and −X% results side by side.',
      'Tip/VAT mode shows the total and the added amount separately.',
      'Accepts comma-formatted numbers (50,000) and computes live as you type.',
      'Copy any result with one tap; runs entirely in your browser.',
    ],
    steps: [
      {
        title: 'Pick the mode',
        body: 'Choose the calculation you need — for example "% change" to compare two figures, or "discount/add" to apply a percentage to a price. The two input labels update to match the mode.',
      },
      {
        title: 'Enter the two numbers',
        body: 'Fill in the fields shown. For "X% of a value", enter 15 and 200,000 to get 30,000. Commas are accepted, so 200,000 works as typed.',
      },
      {
        title: 'Read and copy the answer',
        body: 'The result shows immediately, with a secondary figure where relevant (e.g. add/subtract shows both the increased and decreased amounts). Tap copy to grab the number.',
      },
    ],
    faqs: [
      {
        q: 'How do I calculate a discount?',
        a: 'Use the add/subtract mode: enter the original price and the discount percent. It shows both the −X% result (the sale price) and the +X% result. For example, 50,000 with 20% gives 40,000 as the discounted price.',
      },
      {
        q: 'How is percent change calculated?',
        a: 'Percent change is (new − old) / |old| × 100. Going from 100 to 130 is a +30% change; 130 to 100 is about −23%. The "change" mode does this for you — enter the start and end values.',
      },
      {
        q: 'What’s the difference between "X% of N" and "X is what % of N"?',
        a: 'The first finds a part from a percentage: 15% of 200 is 30. The second finds the percentage from a part: 30 is 15% of 200. They’re inverse operations, and this tool has a separate mode for each so you don’t have to rearrange the formula.',
      },
    ],
  },

  compress: {
    metaTitle: 'Compress Image & PDF Online — Reduce File Size Free',
    metaDescription:
      'Shrink images and PDFs in your browser. Drop a JPG to cut quality and dimensions, or a PDF and use smart mode to re-compress images while keeping text crisp. No upload, free.',
    intro:
      'This tool reduces the file size of images and PDFs, entirely in your browser. Drop a JPG/PNG/WebP and tune quality and max dimension; drop a PDF and pick a mode — "smart" re-compresses only the embedded images so text and vectors stay sharp, while "rasterize" flattens pages to JPEG for the biggest cut. Folders can be batch-compressed to a ZIP.',
    features: [
      'Handles both images (JPG/PNG/WebP) and PDFs — it auto-detects which you dropped.',
      'Image options: quality slider, max dimension (long edge), and output as JPEG, WebP or PNG.',
      'PDF modes — light (strip metadata, ~5–15%), smart (re-encode images, keep text selectable), rasterize (flatten to JPEG, max reduction).',
      'Folder batch applies image settings to images and PDF settings to PDFs automatically, output as a ZIP.',
      'Runs entirely in your browser — your files are never uploaded.',
    ],
    steps: [
      {
        title: 'Drop a file or folder',
        body: 'Add an image or a PDF (or switch to folder mode for a mix of both). The tool detects the type and shows the right options — image controls for images, PDF modes for PDFs.',
      },
      {
        title: 'Choose the settings',
        body: 'For images, lower the quality (e.g. 75%) and cap the long edge (e.g. 1920px). For PDFs, pick "smart" to keep text crisp while shrinking images, or "rasterize" for the smallest possible size.',
      },
      {
        title: 'Compress and download',
        body: 'Click "Compress". The result card shows the before/after size and the percent saved; folder jobs download as a single ZIP.',
      },
    ],
    faqs: [
      {
        q: 'Will compressing hurt quality?',
        a: 'It can, depending on how hard you push it. Images use lossy quality, so lower settings introduce visible artifacts — 70–80% is usually a good balance. For PDFs, "smart" mode keeps text and vectors perfectly crisp and only re-compresses images, so it’s the safest choice; "rasterize" affects everything for the biggest reduction.',
      },
      {
        q: 'Which PDF mode should I use?',
        a: 'Use "light" to just strip metadata (small saving, no quality change). Use "smart" (recommended) to re-encode embedded images while keeping text selectable, bookmarks and forms intact. Use "rasterize" only when you need the absolute smallest file and don’t mind losing selectable text — it flattens each page to a JPEG image.',
      },
      {
        q: 'Why didn’t my PDF get much smaller?',
        a: 'Smart mode shrinks images, so a PDF that is mostly text or vector graphics has little to compress — its size is already efficient. Big savings come from PDFs full of high-resolution photos or scans. For a text-heavy PDF, expect only a modest reduction.',
      },
      {
        q: 'Are my files uploaded to compress them?',
        a: 'No. Compression runs locally in your browser (Canvas for images, pdf-lib/PDF.js for PDFs), so files never leave your device — safe for private documents and photos, including folder batches.',
      },
    ],
  },
};

const CATEGORY_NOUN_EN: Record<string, string> = {
  pdf: 'PDF',
  image: 'image',
  video: 'video',
  gif: 'GIF',
  audio: 'audio',
  docs: 'document',
  text: 'text',
  dev: 'developer',
  util: 'utility',
  security: 'security',
  ai: 'AI',
};

export function buildGuideEn(tool: ToolMeta, en: EnToolCopy): GuideContentEn {
  const pattern = getPattern(tool);
  const cat = CATEGORY_NOUN_EN[tool.category] ?? tool.category;

  const metaTitle = `How to Use ${en.name} — Free, No Upload`;
  const metaDescription =
    `${en.description} No signup, no installation — ${cat} processing happens in your browser and files never leave your device.`.slice(
      0,
      155,
    );

  const intro = `${en.name} lets you ${lowerFirst(en.tagline.replace(/\.$/, ''))}. It is a free Web Toolkit ${cat} tool that runs entirely in your browser — no signup, no installation, and nothing is uploaded to a server.`;

  const base: GuideContentEn = {
    metaTitle,
    metaDescription,
    intro,
    features: buildFeatures(pattern, cat),
    steps: buildSteps(tool, pattern, cat, en),
    faqs: buildFaqs(tool, pattern, cat, en),
  };

  const override = CUSTOM_GUIDES_EN[tool.id];
  if (!override) return base;

  return {
    metaTitle: override.metaTitle ?? base.metaTitle,
    metaDescription: override.metaDescription ?? base.metaDescription,
    intro: override.intro ?? base.intro,
    features: override.features ?? base.features,
    steps: override.steps ?? base.steps,
    faqs: override.faqs ? [...override.faqs, ...COMMON_FAQS_EN] : base.faqs,
  };
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function buildFeatures(pattern: GuidePattern, cat: string): string[] {
  const base = [
    'Files never leave your browser — all processing is completed client-side.',
    'No account, no login. Just open the page and start using it instantly.',
  ];
  if (pattern === 'file') {
    return [
      ...base,
      `Drag and drop your ${cat} file (or click to pick one) and the options appear right away.`,
      'Batch mode lets you process several files at once on supported tools.',
      'Install it as a PWA to use it offline from your home screen.',
    ];
  }
  if (pattern === 'generator') {
    return [
      ...base,
      'Secure random / hash / key generation backed by the Web Crypto API — unpredictable by design.',
      'Copy results to the clipboard, save to a file, or share via URL.',
      'Full functionality on mobile, with keyboard shortcuts for fast work.',
    ];
  }
  if (pattern === 'calc') {
    return [
      ...base,
      'Enter values, dates or units and the result is calculated live — no separate button needed.',
      'Shows the actual result, not just a formula, and copies to your clipboard in one click.',
      'Full functionality on mobile; changing any field recalculates instantly.',
    ];
  }
  if (pattern === 'viewer') {
    return [
      ...base,
      `Open a ${cat} file and read its contents and information right on screen — no conversion or saving needed.`,
      'The file is opened only inside your browser and is never uploaded anywhere.',
      'Depending on the tool, export the text, metadata or outline as text/Markdown.',
    ];
  }
  return [
    ...base,
    'Results update live as you type — no separate "convert" button needed.',
    'Copy the output to your clipboard or download it as a file in one click.',
    'Bilingual keyword search and keyboard shortcuts to jump between tools.',
  ];
}

function buildSteps(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
  en: EnToolCopy,
): GuideStepEn[] {
  if (pattern === 'file') {
    return [
      {
        title: `Upload your ${cat} file`,
        body: `Open the tool and drop your ${cat} file into the drop zone, or use the file picker. On mobile you can choose directly from your gallery or files. The file is held in browser memory only and is never transmitted anywhere.`,
      },
      {
        title: 'Set options & preview',
        body: `Choose the options ${en.name} needs (quality, size, format, page range, and so on). Most tools show a live preview so you can adjust settings while watching the result.`,
      },
      {
        title: 'Download the result',
        body: 'Press "Download" or "Save" to store the processed file on your device. Large files may take a moment and show a progress bar; you can cancel at any time to stop immediately.',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      {
        title: 'Pick your options',
        body: 'Select the format, length, strength or algorithm you need. For security output (keys, OTPs, random values) keep the options conservative; for general use the defaults are fine.',
      },
      {
        title: 'Generate instantly',
        body: 'Hit "Generate" and the result is produced in-browser with the Web Crypto / Canvas API. Tweak the options and regenerate to compare.',
      },
      {
        title: 'Copy or save',
        body: 'Copy the result to your clipboard with one click, or save it as a file (PEM, PNG, SVG, TXT, etc.) where appropriate. Store any secret keys somewhere safe.',
      },
    ];
  }
  if (pattern === 'calc') {
    return [
      {
        title: 'Enter your values',
        body: `Type the values ${en.name} needs (dates, amounts, numbers, units, and so on) into the fields. You fill in fields rather than pasting text, so it’s quick even on mobile.`,
      },
      {
        title: 'See the result live',
        body: 'The result recalculates the moment you change an input. Tools that handle several items at once show every result together on one screen.',
      },
      {
        title: 'Copy & use the result',
        body: 'Copy the calculated result to your clipboard and paste it straight into a note, document or message. Refreshing the page clears your inputs.',
      },
    ];
  }
  if (pattern === 'viewer') {
    return [
      {
        title: `Open your ${cat} file`,
        body: `Open the tool and drop your ${cat} file into the drop zone, or use the file picker. The file opens only inside your browser and is never sent to a server.`,
      },
      {
        title: 'Browse the contents',
        body: `${en.name} displays the contents, metadata, outline or structure on screen. There’s no convert-and-download step — read or inspect it directly and find what you need.`,
      },
      {
        title: 'Export if you need to',
        body: 'Depending on the tool, you can export what’s shown as text, Markdown or images. If you only wanted to view it, just close the page — nothing is left behind.',
      },
    ];
  }
  return [
    {
      title: 'Paste your input',
      body: 'Paste or type the text or data you want to convert or analyze into the input area. Even large inputs (tens of MB, tested) are processed instantly.',
    },
    {
      title: 'See the result live',
      body: 'The result updates automatically as you type. If the tool has options, changing them recalculates the output immediately.',
    },
    {
      title: 'Copy or download',
      body: 'Use the "Copy" button to grab the result, or "Download" to save it. Large outputs support .txt, .json and .csv formats.',
    },
  ];
}

function buildFaqs(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
  en: EnToolCopy,
): Array<{ q: string; a: string }> {
  const common = [
    {
      q: 'Are my files uploaded to a server?',
      a: 'No. Only Web Workers, WebAssembly and the Canvas API are used, so everything is processed inside your browser. You can open the Network tab to verify it yourself.',
    },
    {
      q: 'Is it free?',
      a: 'Yes. No signup, no payment, no usage limits. The site is supported by ads, and we do not collect or sell your data.',
    },
    {
      q: 'Does it work on mobile?',
      a: 'Yes. Every tool is designed mobile-first and verified on iOS Safari and Android Chrome. Add it to your home screen to use it like an app.',
    },
  ];

  if (pattern === 'file') {
    return [
      ...common,
      {
        q: 'Is there a file size limit?',
        a: `It works within your browser's memory budget. ${en.name} is tested up to roughly ${
          tool.category === 'video' ? '500 MB' : tool.category === 'pdf' ? '100 MB' : '50 MB'
        }; larger files may take longer or run out of memory.`,
      },
      {
        q: 'Can I process several files at once?',
        a: 'Most tools support batch mode. Drag a whole folder in and the files are picked up automatically; results are bundled into a ZIP for download.',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      ...common,
      {
        q: 'Are the generated results secure?',
        a: 'They use the Web Crypto API secure random source (crypto.getRandomValues / SubtleCrypto), which is more uniform and unpredictable than Math.random. You are responsible for storing any generated secret keys or seeds safely.',
      },
      {
        q: 'Where are the results stored?',
        a: 'Nowhere. Refreshing the page clears them, so copy or save anything you need to keep.',
      },
    ];
  }
  if (pattern === 'calc') {
    return [
      ...common,
      {
        q: 'Are the results accurate?',
        a: `${en.name} implements the standard formulas and computes them in your browser. For items that depend on changing rules or rates (tax, payroll), check the basis (year, rate) shown alongside the result.`,
      },
      {
        q: 'Are my inputs saved?',
        a: 'No. Your inputs are used only inside your browser and are never transmitted or stored. Refreshing the page resets them.',
      },
    ];
  }
  if (pattern === 'viewer') {
    return [
      ...common,
      {
        q: 'Is my file uploaded to a server?',
        a: 'No. The file is opened only inside your browser to display its contents and is never uploaded — safe even for sensitive documents.',
      },
      {
        q: 'Can I save the contents?',
        a: `${en.name} can export the shown text, metadata or outline as text, Markdown or images, depending on the tool. If you only wanted to view it, just close the page.`,
      },
    ];
  }
  return [
    ...common,
    {
      q: 'Can it handle large text?',
      a: 'Inputs of tens of MB are tested. Complex operations such as regex evaluation or diff get slower with bigger inputs, but ordinary documents and code are processed instantly.',
    },
    {
      q: 'Can I change the output format?',
      a: `${en.name} supports the appropriate output formats per tool (.txt, .json, .csv, .md, and so on). Where options exist, you can choose them on screen.`,
    },
  ];
}
