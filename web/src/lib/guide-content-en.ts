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
