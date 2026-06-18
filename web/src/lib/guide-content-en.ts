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

  'color-converter': {
    metaTitle: 'Color Converter — HEX, RGB, HSL & OKLCH Online',
    metaDescription:
      'Convert a color between HEX, RGB, HSL and OKLCH at once. Paste #3b82f6 and get rgb(59, 130, 246), hsl(217, 91%, 60%) and oklch(). Alpha supported. Free, no signup.',
    intro:
      'This color converter takes one color in any common notation and shows it as HEX, RGB, HSL and OKLCH simultaneously. Type #3b82f6 (or rgb(59, 130, 246), or use the color picker) and it instantly returns rgb(59, 130, 246), hsl(217, 91%, 60%) and the OKLCH equivalent — alpha like #3b82f680 is preserved as a 0.50 channel.',
    features: [
      'Four formats at once: enter any one of HEX, RGB, HSL or OKLCH and read all four.',
      'Accepts #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() and hsl()/hsla() input, plus a live color picker.',
      'Alpha (transparency) is carried through — #3b82f680 shows as rgba(..., 0.50) and a checkered swatch.',
      'OKLCH output uses the Björn Ottosson sRGB→OKLab transform for perceptually even colors.',
      'Copy any single row (just the HEX, or just the HSL) with one click.',
    ],
    steps: [
      {
        title: 'Enter or pick a color',
        body: 'Type a value in any notation — for example #3b82f6 — or click the swatch picker. The tool auto-detects the format, so rgb(59, 130, 246) and hsl(217, 91%, 60%) work too.',
      },
      {
        title: 'Read all four conversions',
        body: 'The HEX, RGB, HSL and OKLCH rows update live. For #3b82f6 you get rgb(59, 130, 246), hsl(217, 91%, 60%) and oklch(62.3% 0.214 259.8) — a ready-to-paste set for any stylesheet.',
      },
      {
        title: 'Copy the format you need',
        body: 'Tap "Copy" on a single row to grab just that string, e.g. the hsl(217, 91%, 60%) value for a CSS variable. Add an alpha channel (e.g. #3b82f680) to see the rgba()/hsla() forms.',
      },
    ],
    faqs: [
      {
        q: 'What is OKLCH and why use it?',
        a: 'OKLCH is a modern CSS color space (Lightness, Chroma, Hue) built on OKLab. It is perceptually uniform, so changing Lightness or Hue looks even to the eye — unlike HSL, where the same lightness value can look very different across hues. It is great for generating accessible palettes.',
      },
      {
        q: 'Does it support transparency (alpha)?',
        a: 'Yes. Use an 8-digit hex like #3b82f680, or rgba()/hsla() with a fourth value. The converter keeps the alpha and shows it as a 0–1 channel (0.50 for 80 hex) in every output, plus a checkerboard swatch.',
      },
      {
        q: 'How accurate is the OKLCH conversion?',
        a: 'It uses the standard sRGB→linear→OKLab→OKLCH math, accurate to design tolerances. Because OKLCH can describe colors outside the sRGB gamut, round-tripping an out-of-gamut OKLCH value back to HEX may clip slightly.',
      },
    ],
  },

  'timestamp-converter': {
    metaTitle: 'Unix Timestamp Converter — Epoch ↔ ISO / Local Time',
    metaDescription:
      'Convert a Unix timestamp to a human date and back. 1700000000 becomes 2023-11-14T22:13:20Z; pick a date to get the epoch seconds and milliseconds. Free, no signup.',
    intro:
      'This Unix timestamp converter turns epoch numbers into readable dates and back. Enter 1700000000 (seconds) and it shows 2023-11-14T22:13:20.000Z plus your local time; switch to a date picker and it returns the epoch in both seconds and milliseconds. A live clock shows the current timestamp too.',
    features: [
      'Timestamp → date and date → timestamp, in one screen.',
      'Seconds / milliseconds toggle — read 1700000000 as 2023-11-14, or 1700000000000 as the same instant.',
      'Live "now" panel showing the current Unix seconds, milliseconds and ISO 8601 UTC string.',
      'Outputs both UTC (ISO 8601) and your local timezone so you can spot offset issues.',
      'Copy any value (epoch or ISO) with one tap.',
    ],
    steps: [
      {
        title: 'Convert a timestamp to a date',
        body: 'Paste the number — e.g. 1700000000 — and choose the unit (seconds or ms). You get 2023-11-14T22:13:20.000Z in UTC plus the same moment in your local time.',
      },
      {
        title: 'Convert a date to a timestamp',
        body: 'Use the date-time picker in the "date → timestamp" section. Pick 2023-11-14 22:13:20 and it returns 1700000000 seconds and 1700000000000 milliseconds, ready to copy.',
      },
      {
        title: 'Grab the current time',
        body: 'The "now" panel ticks every second with the live epoch. Copy the current seconds value (e.g. for a created_at field) directly from there.',
      },
    ],
    faqs: [
      {
        q: 'Is a Unix timestamp in seconds or milliseconds?',
        a: 'Classic Unix time is seconds since 1970-01-01 UTC, so 1700000000 is about 10 digits. JavaScript Date.now() returns milliseconds (13 digits), e.g. 1700000000000. Use the seconds/ms toggle to match — feeding ms as seconds would land you in the year 55,000+.',
      },
      {
        q: 'What timezone is the result in?',
        a: 'The ISO 8601 output ends in Z, meaning UTC. The tool also shows the same instant in your browser’s local timezone so you can compare. The underlying epoch number itself is timezone-independent.',
      },
      {
        q: 'Why does 1700000000 show as 2023, not 1970?',
        a: 'Epoch counts seconds since 1970. 1,700,000,000 seconds is roughly 53.9 years, which lands in November 2023. Small numbers like 86400 map to 1970-01-02 (one day after the epoch).',
      },
    ],
  },

  'cron-explainer': {
    metaTitle: 'Cron Expression Explainer — Decode & Next Run Times',
    metaDescription:
      'Paste a 5-field cron like 0 9 * * 1-5 and get a plain-English meaning plus the next 7 run times. Supports */5, ranges, JAN-DEC and SUN-SAT aliases. Free, no signup.',
    intro:
      'This cron explainer decodes a standard 5-field cron expression and shows what it actually does, plus the next 7 times it would fire. Enter 0 9 * * 1-5 and it reads "at 09:00 on weekdays"; enter */5 * * * * and it explains "every 5 minutes" with the upcoming run schedule in your local time.',
    features: [
      'Plain-language summary of any 5-field cron (minute hour day month weekday).',
      'Computes the next 7 run times in your local timezone so you can sanity-check.',
      'Supports steps (*/5), ranges (1-5), lists (1,3,5) and JAN-DEC / SUN-SAT name aliases.',
      'Per-field breakdown showing exactly which values each field matches.',
      'One-click presets like "every 5 minutes" (*/5 * * * *) and "weekdays 9am" (0 9 * * 1-5).',
    ],
    steps: [
      {
        title: 'Enter your cron expression',
        body: 'Type the five space-separated fields, e.g. 0 9 * * 1-5 (minute hour day-of-month month day-of-week). Invalid input like a 6th field or */0 is flagged with a clear error.',
      },
      {
        title: 'Read the explanation',
        body: 'The summary translates it to words — 0 9 * * 1-5 becomes "weekdays at 09:00" — and the field grid shows how many values each part matches (e.g. weekday = 5 values: Mon–Fri).',
      },
      {
        title: 'Check the next run times',
        body: 'The "next runs" list shows the upcoming 7 fire times in your local time. For */5 * * * * you would see times five minutes apart, confirming the schedule before you deploy it.',
      },
    ],
    faqs: [
      {
        q: 'What does */5 mean in cron?',
        a: 'A step value. */5 in the minute field means "every 5 minutes" (0, 5, 10, … 55). Likewise */2 in the hour field is every 2 hours. The step starts from the lowest value of the field.',
      },
      {
        q: 'Is Sunday 0 or 7 in the weekday field?',
        a: 'Both. The day-of-week field is 0–6 where 0 = Sunday, but standard Unix cron also accepts 7 as Sunday. This tool folds 7 back to 0, so 0 0 * * 0 and 0 0 * * 7 both mean Sunday midnight.',
      },
      {
        q: 'How do the day-of-month and day-of-week fields combine?',
        a: 'Per standard cron, when BOTH the day-of-month and day-of-week fields are restricted (not *), they are OR-ed — the job runs if either matches. If one is *, they are effectively AND-ed. This tool follows that rule when computing the next runs.',
      },
      {
        q: 'Does it support seconds or @yearly shortcuts?',
        a: 'No. It handles the classic 5-field format (minute hour day month weekday). It does not parse 6-field (with-seconds) crontabs or named macros like @daily / @reboot.',
      },
    ],
  },

  'pdf-to-jpg': {
    metaTitle: 'PDF to JPG — Convert PDF Pages to Images Online',
    metaDescription:
      'Turn each PDF page into a JPG or PNG image. Render at up to 4x for crisp output, pick pages like 1, 3, 5-7, and download a single image or a ZIP. Free, no signup.',
    intro:
      'This PDF-to-JPG tool renders each page of a PDF as a separate image. Convert all pages or just a range like 1, 3, 5-7; choose JPG or PNG, set the render scale up to 4x for sharpness, and get one image back or a ZIP when there are several. Everything renders in your browser via PDF.js.',
    features: [
      'Renders every PDF page to a real raster image (JPG or PNG), not just a screenshot.',
      'Page selection: convert all pages or a custom range such as 1, 3, 5-7.',
      'Render scale from 1x to 4x — higher means crisper images and larger files.',
      'Adjustable JPEG quality; multiple pages are bundled into a single ZIP download.',
      'Runs fully in-browser (PDF.js) — your PDF is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload your PDF',
        body: 'Drop in a PDF (up to 100MB). The tool reads the page count so you know the valid range — for a 20-page file you can pick anything from 1 to 20.',
      },
      {
        title: 'Pick format, scale and pages',
        body: 'Choose JPG (with a quality slider) or PNG, set the render scale — 2x is a good default, 4x for print sharpness — and either keep "all pages" or type a range like 5-7.',
      },
      {
        title: 'Convert and download',
        body: 'Click convert. A single page downloads as one .jpg; multiple pages come back as a ZIP (e.g. mydoc-images.zip) with each page named mydoc-p01.jpg, p02, and so on.',
      },
    ],
    faqs: [
      {
        q: 'What resolution do I get?',
        a: 'It depends on the render scale. A page is rendered at scale × its native size, so a standard A4 page at 2x is roughly 1240×1754 px, and 4x doubles that again. Pick higher scale for printing, lower for web.',
      },
      {
        q: 'JPG or PNG — which should I choose?',
        a: 'JPG is smaller and ideal for pages with photos or scans (use ~85% quality). PNG is lossless and better for pages of crisp text, line art or screenshots where you want no compression artifacts.',
      },
      {
        q: 'Can I convert just specific pages?',
        a: 'Yes. Switch to "specify pages" and enter a list/range like 1, 3, 5-7. Only those pages are rendered, which is faster than converting a whole large document.',
      },
    ],
  },

  'pdf-from-jpg': {
    metaTitle: 'JPG to PDF — Combine Images into One PDF Online',
    metaDescription:
      'Merge multiple JPG or PNG images into a single PDF. Reorder pages, choose A4/Letter/Legal or fit-to-image, set margins, and download. Free, in-browser, no signup.',
    intro:
      'This JPG-to-PDF tool combines several images into one PDF, one image per page. Drop in your JPGs or PNGs, drag them into the right order, pick a page size (A4, Letter, Legal, or fit-to-image) with optional margins, and download a single .pdf. It runs entirely in your browser with pdf-lib.',
    features: [
      'Combine many JPG/PNG images into one multi-page PDF.',
      'Reorder images before export so the pages come out in the order you want.',
      'Page-size choices: A4, Letter, Legal, or "fit to image" that sizes each page to its picture.',
      'Portrait/landscape orientation and four margin presets (none → large).',
      'Processed locally with pdf-lib — images are never uploaded.',
    ],
    steps: [
      {
        title: 'Add your images',
        body: 'Drop in multiple JPG or PNG files at once. Each becomes one page. A thumbnail grid shows them numbered 1, 2, 3 in their current order.',
      },
      {
        title: 'Order and configure',
        body: 'Use the up/down arrows to reorder, remove any you do not want, then pick a page size — A4 portrait with small margins is a common choice, or "fit to image" to avoid borders entirely.',
      },
      {
        title: 'Build the PDF',
        body: 'Click "convert to PDF". A 3-image set becomes a 3-page document; download it as images.pdf (or the single file’s name if you added just one).',
      },
    ],
    faqs: [
      {
        q: 'Are the images compressed or downscaled?',
        a: 'No. JPGs are embedded as-is and PNGs are embedded losslessly, so quality is preserved. The image is scaled to fit the page within the margins but the embedded data is not re-compressed.',
      },
      {
        q: 'Can I control the page order?',
        a: 'Yes. The thumbnail grid is numbered and each tile has up/down controls. Arrange them before converting and the PDF pages follow that exact order.',
      },
      {
        q: 'What if my images are different sizes?',
        a: 'With A4/Letter/Legal, every image is centered and scaled to fit a uniform page. Choose "fit to image" instead if you want each page to match its own picture’s dimensions exactly.',
      },
    ],
  },

  'pdf-to-word': {
    metaTitle: 'PDF to Word — Extract PDF Text to an Editable .doc',
    metaDescription:
      'Extract the text from a PDF into a Word-compatible .doc you can edit in Word, Google Docs or LibreOffice. Text-only — layout and images are not kept. Free, no signup.',
    intro:
      'This PDF-to-Word tool pulls the selectable text out of a PDF and saves it as a Word-readable .doc file. It is built for text-heavy documents: paste-ready paragraphs and headings open straight in Word, Google Docs, Hancom or LibreOffice. It does not reproduce the original page layout, columns or images.',
    features: [
      'Extracts the PDF’s real text into an editable Word document (.doc).',
      'Opens in Microsoft Word, Google Docs, Hancom Office and LibreOffice.',
      'Preserves heading structure and paragraphs so the text stays readable.',
      'Warns you when a PDF has no extractable text (e.g. a scan) instead of producing an empty file.',
      'Runs entirely in your browser (PDF.js) — the PDF is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload the PDF',
        body: 'Drop in a text-based PDF (up to 100MB) — for example a report or contract exported from Word or a web page.',
      },
      {
        title: 'Convert to Word',
        body: 'Click "convert to Word". The tool extracts the text, converts it to a Word-compatible HTML .doc, and shows a download for report.doc (matching your file name).',
      },
      {
        title: 'Open and edit',
        body: 'Open the .doc in Word or Google Docs. The text is fully editable. If you uploaded a scanned image PDF, run an OCR tool first — there is no text to extract otherwise.',
      },
    ],
    faqs: [
      {
        q: 'Does it preserve the original layout, fonts and images?',
        a: 'No — this is a text-extraction tool. It produces a clean, editable .doc with paragraphs and headings, but multi-column layouts, exact positioning, embedded images and fancy formatting are NOT reproduced. Use it when you need the words, not a pixel-perfect copy.',
      },
      {
        q: 'Is the output a real .docx file?',
        a: 'It is an HTML-based Word document saved with a .doc extension, which Word, Google Docs, Hancom and LibreOffice all open and let you re-save as .docx. It is not the binary Office Open XML .docx format.',
      },
      {
        q: 'Why is my converted file empty?',
        a: 'The PDF probably has no selectable text — it is a scan or an image-only export. The tool detects this and tells you to run OCR first to turn the page images into text, then convert.',
      },
    ],
  },

  'csv-json': {
    metaTitle: 'CSV to JSON & JSON to CSV Converter — Free Online',
    metaDescription:
      'Convert CSV to JSON and JSON back to CSV. Choose comma, semicolon or tab delimiters, treat the first row as headers, and get typed values. Free, in-browser, no signup.',
    intro:
      'This CSV/JSON converter goes both ways. Paste CSV like name,age,city / Alice,30,Seoul and get a JSON array of objects; paste a JSON array and get CSV back. Pick the delimiter (comma, semicolon or tab), choose whether the first row is a header, and copy or download the result. Parsing uses PapaParse, all in your browser.',
    features: [
      'Two-way: CSV → JSON array and JSON array → CSV.',
      'Delimiter choice — comma, semicolon or tab — for both reading and writing.',
      '"First row as header" toggle so rows become objects keyed by column name.',
      'Auto-typing turns "30" into the number 30 and "true" into a boolean in the JSON output.',
      'Copy or download the result; powered by PapaParse for robust quoting and large files.',
    ],
    steps: [
      {
        title: 'Pick a direction',
        body: 'Choose CSV → JSON or JSON → CSV. For CSV → JSON, paste rows such as name,age,city on the first line then your data lines below.',
      },
      {
        title: 'Set delimiter and header',
        body: 'Select the delimiter (comma by default; switch to tab for TSV) and keep "first row as header" on so name,age,city becomes the object keys. Toggle "pretty JSON" for indented output.',
      },
      {
        title: 'Copy or download',
        body: 'The output updates live — Alice,30,Seoul becomes {"name":"Alice","age":30,"city":"Seoul"}. Copy it or download converted.json (or converted.csv when going the other way).',
      },
    ],
    faqs: [
      {
        q: 'How is the header row handled?',
        a: 'With "first row as header" on, the first CSV line supplies the object keys, so name,age,city + Alice,30,Seoul becomes {"name":"Alice","age":30,"city":"Seoul"}. Turn it off and each row becomes a plain array of values instead.',
      },
      {
        q: 'Can I use semicolons or tabs instead of commas?',
        a: 'Yes. The delimiter selector supports comma, semicolon and tab, which covers European CSVs (semicolon) and TSV files (tab). The same delimiter is used when writing CSV back out.',
      },
      {
        q: 'What does JSON → CSV need as input?',
        a: 'A JSON array of objects, e.g. [{"name":"Alice","age":30}, …]. The keys of the first objects become the column headers. A single object or a non-array value is rejected with an error.',
      },
    ],
  },

  'yaml-json': {
    metaTitle: 'YAML to JSON & JSON to YAML Converter — Free Online',
    metaDescription:
      'Convert YAML to JSON and JSON to YAML both ways. Paste a config, anchors and nested keys included, and copy or download the result. In-browser, free, no signup.',
    intro:
      'This YAML/JSON converter translates configuration between the two formats in either direction. Paste a YAML file — nested keys, lists and all — to get clean JSON, or paste JSON to get readable 2-space YAML. It uses js-yaml in your browser, so even private CI configs and secrets never leave the page.',
    features: [
      'Two-way conversion: YAML → JSON and JSON → YAML.',
      'Handles nested maps, sequences and scalars — full YAML 1.1 via js-yaml.',
      'Pretty-print toggle for JSON (2-space indentation) and tidy YAML output.',
      'One-click swap to flip the direction using the current output as the new input.',
      'Copy or download converted.json / converted.yaml; runs entirely in-browser.',
    ],
    steps: [
      {
        title: 'Choose the direction',
        body: 'Pick YAML → JSON or JSON → YAML. For YAML → JSON, paste something like name: web-toolkit with an indented features: block underneath.',
      },
      {
        title: 'Convert and review',
        body: 'The output updates as you type. A YAML list under authors: becomes a JSON array ["alice","bob"]; nested keys become nested objects. Errors (bad indentation, tabs) are shown inline.',
      },
      {
        title: 'Copy, download or swap',
        body: 'Copy the result, download it as converted.json / converted.yaml, or hit swap to send the output back as input and convert the other way.',
      },
    ],
    faqs: [
      {
        q: 'Does it keep YAML comments?',
        a: 'No. YAML is parsed into a data structure (maps, lists, scalars) before being re-serialized, and comments are not part of that structure, so they are dropped. Values, keys and nesting are preserved exactly.',
      },
      {
        q: 'What happens to YAML anchors and aliases?',
        a: 'They are resolved on read — an alias is expanded into the value it references. When writing YAML back out, the tool emits plain values without re-introducing anchors (noRefs), so the output is self-contained.',
      },
      {
        q: 'Why does my YAML fail to parse?',
        a: 'Almost always indentation: YAML requires spaces, not tabs, and consistent nesting. The error message points to the line. JSON → YAML, by contrast, rarely fails since JSON is stricter to begin with.',
      },
    ],
  },

  'text-case': {
    metaTitle: 'Text Case Converter — camelCase, snake_case & More',
    metaDescription:
      'Convert text between 12 cases at once: UPPER, lower, Title, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and more. helloWorld → hello_world. Free, no signup.',
    intro:
      'This text case converter transforms one input into a dozen case styles simultaneously. Type "hello world" and instantly see HELLO WORLD, Title Case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case. It intelligently splits words, so helloWorld becomes hello_world or hello-world with one click.',
    features: [
      'About 12 cases at once: UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case, capitalize and invert.',
      'Smart word splitting handles camelCase, snake_case and hyphenated input — helloWorld is recognised as two words.',
      'Live conversion as you type, with a sample shown under each result.',
      'Copy any single case (just the snake_case row, say) with one tap.',
      'Runs entirely in your browser; works with non-Latin text too.',
    ],
    steps: [
      {
        title: 'Type or paste your text',
        body: 'Enter the source text — for example helloWorld or "My New Post". The converter detects word boundaries from spaces, camelCase humps and separators.',
      },
      {
        title: 'Scan all the case styles',
        body: 'Every card updates instantly: helloWorld becomes hello_world (snake_case), hello-world (kebab-case), HELLO_WORLD (CONSTANT_CASE) and HelloWorld (PascalCase), among others.',
      },
      {
        title: 'Copy the one you need',
        body: 'Click the copy icon on the case you want — e.g. grab the camelCase value for a variable name or the kebab-case value for a CSS class or URL slug.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between camelCase and PascalCase?',
        a: 'Both join words with no spaces and capitalize each word — but camelCase keeps the first word lowercase (helloWorld) while PascalCase capitalizes it too (HelloWorld). camelCase is common for variables, PascalCase for class names.',
      },
      {
        q: 'How does snake_case differ from CONSTANT_CASE?',
        a: 'Both use underscores between words. snake_case is all lowercase (hello_world); CONSTANT_CASE is all uppercase (HELLO_WORLD) and is typically used for constants and environment variables.',
      },
      {
        q: 'Does it correctly split camelCase and acronyms?',
        a: 'Yes. It inserts boundaries at case transitions, so XMLHttpRequest splits into XML, Http, Request, giving xml_http_request. Existing separators (spaces, _, -, . , /) are treated as word breaks too.',
      },
    ],
  },

  'lorem-ipsum': {
    metaTitle: 'Lorem Ipsum Generator — Dummy Placeholder Text',
    metaDescription:
      'Generate Lorem Ipsum placeholder text by paragraphs, sentences or words. Pick a count, start with the classic "Lorem ipsum dolor…", then copy. Free, in-browser, no signup.',
    intro:
      'This Lorem Ipsum generator produces filler text for mockups and designs. Choose paragraphs, sentences or words, set how many you need, and optionally begin with the classic "Lorem ipsum dolor sit amet…". Generate 3 paragraphs for a layout test, copy, and paste — no signup, all in your browser.',
    features: [
      'Generate by unit: paragraphs, sentences or individual words.',
      'Set the count — e.g. 3 paragraphs, 10 sentences, or 50 words.',
      'Optionally start with the canonical "Lorem ipsum dolor sit amet, consectetur adipiscing elit."',
      'Randomized sentence lengths for natural-looking placeholder copy.',
      '"Regenerate" for a fresh block and one-click copy of the whole output.',
    ],
    steps: [
      {
        title: 'Choose unit and count',
        body: 'Pick paragraphs, sentences or words, then enter a number — for instance 3 paragraphs for a typical content block, or 5 words to fill a short label.',
      },
      {
        title: 'Toggle the classic opener',
        body: 'Leave "start with Lorem ipsum…" on to begin with the familiar phrase, or turn it off for fully random Latin-like text. The output refreshes as you change options.',
      },
      {
        title: 'Copy your placeholder text',
        body: 'Hit "regenerate" for a different sample, then "copy" to grab it. Paste it into your design, CMS or HTML to see how real content will flow.',
      },
    ],
    faqs: [
      {
        q: 'Why use Lorem Ipsum instead of real text?',
        a: 'It lets you preview layout and typography without being distracted by meaning. Because it has a normal-looking word distribution, it shows how real copy will wrap and flow far better than repeating "text text text".',
      },
      {
        q: 'Can I generate just a few words or many paragraphs?',
        a: 'Yes. Switch the unit to words for short bursts (e.g. 5–20 for buttons or titles) or paragraphs for long blocks. Sentence lengths are randomized so each paragraph looks natural.',
      },
      {
        q: 'Is the text always the same?',
        a: 'No. Only the optional opening phrase is fixed; the rest is randomly assembled from a Latin word list each time you generate, so clicking "regenerate" gives you a fresh sample.',
      },
    ],
  },

  'image-crop': {
    metaTitle: 'Image Crop Tool — Drag to Crop with Aspect Ratios',
    metaDescription:
      'Crop an image by dragging a box, with presets like 1:1, 16:9, 4:3 and 9:16. Export as JPG, PNG, WebP or AVIF with adjustable quality. Free, in-browser, no signup.',
    intro:
      'This image crop tool lets you drag a selection box over your photo and export just that region. Snap to aspect-ratio presets — 1:1 for avatars, 16:9 for thumbnails, 9:16 for stories — or crop freely. Output to JPG, PNG, WebP or AVIF with a quality slider, all processed locally on a canvas.',
    features: [
      'Drag-to-position crop box with a corner handle to resize.',
      'Aspect-ratio presets: free, 1:1, 4:3, 16:9, 3:4 and 9:16.',
      'Live readout of the original and selected pixel dimensions.',
      'Export as JPG, PNG, WebP or AVIF with an adjustable quality slider.',
      'Canvas-based and fully in-browser — your image is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload and frame your crop',
        body: 'Drop in an image. A box appears at the centre 80%. Drag it to reposition and pull the bottom-right handle to resize; the header shows e.g. "selection 960×540".',
      },
      {
        title: 'Lock an aspect ratio (optional)',
        body: 'Pick a preset like 1:1 for a square profile picture or 16:9 for a video thumbnail. The box snaps to that ratio and keeps it while you resize. Choose "free" to crop any shape.',
      },
      {
        title: 'Choose format and export',
        body: 'Select JPG, PNG, WebP or AVIF, tweak quality if needed, then run the crop. Download the result (e.g. photo-cropped.jpg) — only the selected region is saved.',
      },
    ],
    faqs: [
      {
        q: 'Does cropping reduce image quality?',
        a: 'Cropping itself just keeps the selected pixels at full resolution — no quality loss. Quality only changes if you export to a lossy format (JPG/WebP/AVIF) at a low quality setting; choose PNG for a lossless result.',
      },
      {
        q: 'How do the aspect-ratio presets help?',
        a: 'They keep the crop a fixed shape: 1:1 for square avatars, 16:9 for YouTube thumbnails, 9:16 for Instagram/TikTok stories, 4:3 for classic photos. The box won’t drift off-ratio as you resize.',
      },
      {
        q: 'Can I crop to an exact pixel size?',
        a: 'You position and size the box visually, and the live readout shows the exact selected dimensions (e.g. 1080×1080). For a precise final size you can crop, then run the result through a resize tool.',
      },
    ],
  },

  'image-rotate': {
    metaTitle: 'Rotate & Flip Image — 90/180/270° + Mirror Online',
    metaDescription:
      'Rotate an image 90, 180 or 270 degrees and flip it horizontally or vertically. Export JPG, PNG, WebP or AVIF, or batch a whole folder. Free, in-browser, no signup.',
    intro:
      'This tool rotates and flips images. Turn a sideways phone photo upright with a 90° or 270° rotation, mirror a selfie with a horizontal flip, or do both at once. Export to JPG, PNG, WebP or AVIF, and apply the same transform to an entire folder of images in one batch — all on a canvas in your browser.',
    features: [
      'Rotate 0°, 90°, 180° or 270° clockwise.',
      'Flip horizontally (mirror) and/or vertically, combinable with rotation.',
      'Batch mode: apply the same rotate/flip to a whole folder and download a ZIP.',
      'Export as JPG, PNG, WebP or AVIF with a quality slider.',
      'Canvas-based, fully in-browser — images never leave your device.',
    ],
    steps: [
      {
        title: 'Add an image or a folder',
        body: 'Drop in a single image, or switch to folder mode to process many at once. A landscape photo shot in portrait is the classic case for a 90° fix.',
      },
      {
        title: 'Pick rotation and flips',
        body: 'Choose the angle — 90° rotates a sideways photo upright — and toggle horizontal or vertical flip. The two combine, so you can rotate 180° and mirror in one pass.',
      },
      {
        title: 'Export the result',
        body: 'Select an output format and run it. A single image downloads as photo-rotated.jpg; in folder mode every file is transformed and bundled into a ZIP.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between rotate and flip?',
        a: 'Rotate turns the image around its center (90° makes a landscape photo portrait). Flip mirrors it — horizontal flip swaps left and right (like a mirror selfie), vertical flip swaps top and bottom. They can be combined.',
      },
      {
        q: 'Does 90° rotation change the dimensions?',
        a: 'Yes. A 90° or 270° rotation swaps width and height — a 1920×1080 image becomes 1080×1920. A 180° rotation keeps the same dimensions, just upside down.',
      },
      {
        q: 'Can I fix many photos at once?',
        a: 'Yes. Use folder mode to apply the same rotation and flip to every image in a folder, then download them all as a single ZIP — handy for a batch of sideways phone shots.',
      },
    ],
  },

  'image-watermark': {
    metaTitle: 'Add Watermark to Image — Text or Logo, Online',
    metaDescription:
      'Stamp a text or logo watermark onto images. Set position, opacity, size and rotation, then batch a whole folder. © your name on every photo. Free, in-browser, no signup.',
    intro:
      'This watermark tool overlays text or a logo image onto your photos. Add "© Your Name" in a corner, drop a transparent-PNG logo at adjustable size, and control position, opacity, rotation, font size and color. Apply it to one image or a whole folder at once — all rendered on a canvas in your browser.',
    features: [
      'Text watermark (any text, including non-Latin) or image/logo watermark.',
      'Position presets (corners or center), plus opacity, rotation, font size and color controls.',
      'Logo size is set as a percentage of the base image, so it scales sensibly across photos.',
      'Batch mode applies the same watermark to a whole folder and returns a ZIP.',
      'Canvas-based and fully in-browser — photos are never uploaded.',
    ],
    steps: [
      {
        title: 'Upload the image(s)',
        body: 'Add a single photo, or switch to folder mode to watermark many at once. Then choose a text watermark or an image/logo watermark.',
      },
      {
        title: 'Design the watermark',
        body: 'For text, type "© SAMPLE", set font size and color; for a logo, drop a transparent PNG and set its size. Then choose a corner (bottom-right is typical), opacity (~70%) and rotation.',
      },
      {
        title: 'Apply and download',
        body: 'Run it to get photo-watermarked.jpg with the mark baked in. In folder mode, every image gets the same stamp and you download them as one ZIP.',
      },
    ],
    faqs: [
      {
        q: 'Should I use a text or a logo watermark?',
        a: 'Use text for a quick copyright line like © Your Name 2026 — fast and crisp at any size. Use an image watermark to place a brand logo; a transparent-background PNG works best so only the logo shows, not a box.',
      },
      {
        q: 'Can I make the watermark semi-transparent?',
        a: 'Yes. The opacity slider goes from 10% to 100%. Around 60–70% is a good balance: visible enough to deter copying but not so heavy that it ruins the photo. You can also rotate it diagonally.',
      },
      {
        q: 'Can it be removed by someone else?',
        a: 'The watermark is flattened into the pixels, so it can’t be toggled off — but a determined editor could still crop or paint it out. A larger, centered, semi-transparent mark across the image is harder to remove than a small corner stamp.',
      },
    ],
  },

  'sql-format': {
    metaTitle: 'SQL Formatter — Beautify & Indent SQL (10 Dialects)',
    metaDescription:
      'Format and indent messy SQL with keyword casing and 2/4-space indent. Supports MySQL, PostgreSQL, SQLite, T-SQL, BigQuery and more. Also minify to one line. Free, no signup.',
    intro:
      'This SQL formatter takes a cramped one-line query and lays it out with clean indentation and consistent keyword casing. Paste a SELECT … JOIN … GROUP BY chain, choose your dialect (MySQL, PostgreSQL, T-SQL, BigQuery and 6 more), set 2- or 4-space indent and UPPER/lower keywords, and get readable SQL back — or minify it to a single line.',
    features: [
      'Beautifies SQL with proper indentation and line breaks per clause.',
      '10 dialects: Standard SQL, MySQL, PostgreSQL, SQLite, MariaDB, T-SQL, BigQuery, Redshift, Spark and more.',
      'Keyword case control — uppercase, lowercase or preserve the original.',
      'Indent width of 2 or 4 spaces (or a tab); also a "minify to one line" mode.',
      'Powered by sql-formatter, running entirely in your browser.',
    ],
    steps: [
      {
        title: 'Paste your SQL',
        body: 'Drop in a query — even a dense one-liner like select u.id,u.name,count(o.id) from users u left join orders o on u.id=o.user_id group by u.id.',
      },
      {
        title: 'Choose dialect and style',
        body: 'Pick the dialect (e.g. PostgreSQL), indent width (2 spaces is common) and keyword case (UPPERCASE is the usual convention for readability).',
      },
      {
        title: 'Format or minify',
        body: 'Click "format" for a clean, indented version with SELECT, FROM, JOIN and WHERE on their own lines — then copy or download formatted.sql. Or click "minify" to collapse it back to one line.',
      },
    ],
    faqs: [
      {
        q: 'Why pick a specific SQL dialect?',
        a: 'Dialects differ in keywords, functions and quoting. Choosing PostgreSQL vs MySQL vs T-SQL lets the formatter recognise dialect-specific keywords and lay them out correctly, rather than treating them as plain identifiers.',
      },
      {
        q: 'Does formatting change what my query does?',
        a: 'No. It only adds whitespace, line breaks and adjusts keyword casing — the SQL logic is untouched. Comments and string literals are preserved. (Minify removes comments to collapse to one line.)',
      },
      {
        q: 'Should keywords be uppercase or lowercase?',
        a: 'It is purely style. Uppercase keywords (SELECT, FROM, WHERE) are the traditional convention and make structure easy to scan; lowercase is popular in some modern codebases. "Preserve" keeps whatever you typed.',
      },
    ],
  },

  'html-entities': {
    metaTitle: 'HTML Entity Encoder & Decoder — Escape Special Chars',
    metaDescription:
      'Encode special characters to HTML entities and decode them back. < becomes &lt;, © becomes &#169;. Handles named, decimal and hex entities. Free, in-browser, no signup.',
    intro:
      'This HTML entity tool encodes special characters into safe HTML entities and decodes entities back to text. Turn <div class="x"> into &lt;div class=&quot;x&quot;&gt; so it displays as code, or decode &amp;copy; and &#169; back to ©. It handles named, decimal and hex entities and runs entirely in your browser.',
    features: [
      'Encode text to entities and decode entities back to text — switch with one button.',
      'Encodes the reserved characters & < > " ’ so markup shows literally instead of rendering.',
      'Optional "encode all non-ASCII" mode turns © into &#169; and any accented or CJK character into a numeric entity.',
      'Decoding understands named (&copy;), decimal (&#169;) and hex (&#xa9;) entities.',
      'Live conversion with one-click copy; nothing is uploaded.',
    ],
    steps: [
      {
        title: 'Pick encode or decode',
        body: 'Choose "encode" to make text safe for HTML, or "decode" to turn entities back into characters. Use the swap button to reverse direction with the current output.',
      },
      {
        title: 'Enter your text',
        body: 'Paste your content — for example <div class="hello">. Encoding produces &lt;div class=&quot;hello&quot;&gt;, which a browser will display as the literal tag instead of rendering it.',
      },
      {
        title: 'Copy the result',
        body: 'Grab the output with the copy button. Turn on "encode all non-ASCII" to also convert characters like © to &#169; and é to &#233; for maximum portability.',
      },
    ],
    faqs: [
      {
        q: 'Which characters must be encoded in HTML?',
        a: 'The five reserved ones: & (&amp;), < (&lt;), > (&gt;), " (&quot;) and ’ (&#39;). Encoding < and > stops the browser from treating your text as tags, and & avoids accidental entity parsing.',
      },
      {
        q: 'What is the difference between named, decimal and hex entities?',
        a: 'They are three ways to write the same character. © can be &copy; (named), &#169; (decimal) or &#xa9; (hex). Named entities are readable; numeric ones (decimal/hex) work even when no name exists. The decoder accepts all three.',
      },
      {
        q: 'Why would I encode every non-ASCII character?',
        a: 'For maximum compatibility with systems or emails that may not handle UTF-8 reliably. Turning on "encode all non-ASCII" converts ©, é, 한 and emoji into numeric entities so they survive ASCII-only transport. For normal UTF-8 pages it is unnecessary.',
      },
    ],
  },

  'file-hash': {
    metaTitle: 'File Hash Calculator — MD5, SHA-1, SHA-256, SHA-512',
    metaDescription:
      'Calculate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 checksums of a file or text in your browser. Verify downloads — SHA-256 is 64 hex chars. Free, no upload, no signup.',
    intro:
      'This file hash calculator computes the MD5, SHA-1, SHA-256, SHA-384 and SHA-512 checksums of any file or text. Drop in a downloaded ISO to verify it matches the publisher’s SHA-256 (a 64-character hex string), or hash a piece of text. SHA hashes use the Web Crypto API; everything stays in your browser.',
    features: [
      'Computes MD5, SHA-1, SHA-256, SHA-384 and SHA-512 in one pass.',
      'Hash a file (any type) or a snippet of text.',
      'SHA family runs on the native Web Crypto API; MD5 uses a built-in pure-JS implementation.',
      'Copy any individual digest to compare against a published checksum.',
      'Fully in-browser — files are never uploaded, even large ones.',
    ],
    steps: [
      {
        title: 'Choose file or text',
        body: 'Switch to "file hash" and drop in a file (e.g. an installer or ISO you just downloaded), or "text hash" and type a string to fingerprint.',
      },
      {
        title: 'Read the digests',
        body: 'All five hashes appear at once. SHA-256 is the usual one for download verification — it is a 64-character hex string like e3b0c44298fc1c14….',
      },
      {
        title: 'Compare or copy',
        body: 'Copy the SHA-256 row and compare it character-for-character with the checksum on the download page. If they match exactly, the file is intact and untampered.',
      },
    ],
    faqs: [
      {
        q: 'How long is each hash?',
        a: 'Hash length is fixed by the algorithm: MD5 is 32 hex characters, SHA-1 is 40, SHA-256 is 64, SHA-384 is 96 and SHA-512 is 128. The same input always yields the same length.',
      },
      {
        q: 'Is MD5 (or SHA-1) safe to use?',
        a: 'For verifying accidental corruption of a download, MD5 and SHA-1 are fine. For security (signatures, password storage, tamper protection) they are broken — use SHA-256 or stronger, since collisions can be deliberately crafted for MD5 and SHA-1.',
      },
      {
        q: 'Is my file uploaded to hash it?',
        a: 'No. The SHA algorithms run via the browser’s Web Crypto API and MD5 in local JavaScript, so the file is read in memory and never sent anywhere — safe for private or large files.',
      },
    ],
  },

  'totp': {
    metaTitle: 'TOTP Generator — Google Authenticator 2FA Codes',
    metaDescription:
      'Generate time-based one-time passwords (TOTP) from a Base32 secret, compatible with Google Authenticator and Authy. RFC 6238, default SHA-1/6-digit/30s. Free, no signup.',
    intro:
      'This TOTP generator turns a Base32 secret into the same 6-digit codes as Google Authenticator, Authy or 1Password. Paste the secret from a 2FA setup QR (the secret= value), and it shows the current code, a countdown, and the next code. It follows RFC 6238, and the secret is processed only in your browser.',
    features: [
      'Generates Google Authenticator-compatible TOTP codes from a Base32 secret.',
      'Live countdown and a preview of the next code so you never miss the window.',
      'Configurable digits (6/7/8), period (15/30/60s) and algorithm (SHA-1/256/512).',
      'RFC 6238 standard, computed with the Web Crypto API HMAC.',
      'The secret never leaves your browser — nothing is uploaded.',
    ],
    steps: [
      {
        title: 'Enter your Base32 secret',
        body: 'Paste the secret from your 2FA setup — the secret= value in an otpauth:// URI, e.g. JBSWY3DPEHPK3PXP. Use the eye button to reveal or hide it.',
      },
      {
        title: 'Match the parameters',
        body: 'Most services use the defaults: SHA-1, 6 digits, 30 seconds. Only change digits, period or algorithm if your provider specifies something else.',
      },
      {
        title: 'Read the current code',
        body: 'The 6-digit code shows with a "seconds remaining" countdown and the next code beneath it. Copy it and enter it where the login asks for your authenticator code.',
      },
    ],
    faqs: [
      {
        q: 'Where is my secret stored?',
        a: 'Nowhere on a server. The secret is held only in the page’s memory while you have it open and is never transmitted. Refreshing or closing the tab discards it — so re-paste it next time, or keep it in a real authenticator app.',
      },
      {
        q: 'What if the generated code is rejected?',
        a: 'Usually a clock issue: TOTP depends on the current time, so if your device clock is off by more than ~30 seconds the code won’t match. Sync your system clock. Also confirm the digits/period/algorithm match the service (default is SHA-1, 6 digits, 30s).',
      },
      {
        q: 'Is this a safe replacement for an authenticator app?',
        a: 'It is handy for testing or recovering a code, but because the secret isn’t stored, you must paste it each time. For everyday 2FA, a dedicated app (or hardware key) that stores secrets securely is the better choice.',
      },
    ],
  },

  'slugify': {
    metaTitle: 'Slugify — Convert a Title to a URL Slug Online',
    metaDescription:
      'Turn any title into a clean URL slug. Spaces become hyphens, accents are stripped (café → cafe) and non-Latin text is transliterated (한글 → hangeul). Free, in-browser, no signup.',
    intro:
      'This slugify tool converts a title into a URL-friendly slug. "My New Post!" becomes my-new-post; accented letters are flattened (café → cafe) and non-Latin scripts are transliterated, so Korean like 안녕하세요 becomes annyeonghaseyo. Choose a hyphen or underscore separator and lowercase output, all live in your browser.',
    features: [
      'Converts titles to clean slugs — lowercases, trims and replaces spaces.',
      'Strips diacritics: café → cafe, naïve → naive.',
      'Transliterates Korean Hangul to romanized Latin (한글 → hangeul) instead of dropping it.',
      'Choose hyphen (-) or underscore (_) as the word separator.',
      'Collapses repeated separators and trims them from the ends; live and in-browser.',
    ],
    steps: [
      {
        title: 'Type or paste a title',
        body: 'Enter the heading you want to turn into a URL — for example "안녕하세요 Hello World" or "My New Post!".',
      },
      {
        title: 'Pick separator and case',
        body: 'Choose hyphen (the SEO-standard) or underscore, and keep "lowercase" on. The slug updates live: "안녕하세요 Hello World" becomes annyeonghaseyo-hello-world.',
      },
      {
        title: 'Copy the slug',
        body: 'Click copy and paste the slug into your CMS, blog URL or file name. Special characters and punctuation are already removed, so it is safe to use directly.',
      },
    ],
    faqs: [
      {
        q: 'What happens to non-English characters?',
        a: 'Korean Hangul is transliterated to Latin (한글 → hangeul) so the slug stays meaningful and ASCII-safe. Accented Latin letters are reduced to their base form (é → e). Other unsupported symbols are replaced by the separator.',
      },
      {
        q: 'Should I use hyphens or underscores in a URL slug?',
        a: 'Hyphens. Search engines treat hyphens as word separators, so my-new-post reads as three words, while my_new_post can be read as one token. Underscores are still offered for file names or systems that require them.',
      },
      {
        q: 'Why are some characters removed entirely?',
        a: 'Anything that isn’t a letter or number — punctuation, emoji, brackets — is converted to the separator, and runs of separators are collapsed to one. So "Hello!! World??" becomes hello-world with no trailing or doubled dashes.',
      },
    ],
  },

  'markdown-toc': {
    metaTitle: 'Markdown Table of Contents Generator — Auto TOC',
    metaDescription:
      'Generate a Markdown table of contents from your headings, with GitHub-style anchor links. Choose depth, numbered or bulleted, and insert it inline. Free, in-browser, no signup.',
    intro:
      'This Markdown TOC generator scans your document’s ## headings and builds a linked table of contents automatically. It produces GitHub-style anchor links (## Getting Started → #getting-started), respects a chosen depth, can number or bullet the list, and even inject the TOC between <!-- TOC --> markers in your file. Fenced code blocks are ignored.',
    features: [
      'Auto-extracts headings (H1–H6) and builds a nested table of contents.',
      'GitHub-style slug anchors so links jump correctly on GitHub/GitLab.',
      'Depth control: choose the starting level and maximum depth (e.g. H2–H4 only).',
      'Bulleted or numbered output, with or without clickable links.',
      'Optional inline insertion between <!-- TOC --> markers; ignores headings inside ``` code fences.',
    ],
    steps: [
      {
        title: 'Paste your Markdown',
        body: 'Drop your document in the editor. The tool counts the headings live — a file with ## 1. Getting Started, ### Install, ## 2. Usage shows "5 headings" and so on.',
      },
      {
        title: 'Set depth and style',
        body: 'Choose the start level and max depth (e.g. H1 to H4), then toggle numbered vs bulleted and whether to include links. Deeper headings are indented automatically.',
      },
      {
        title: 'Copy or insert the TOC',
        body: 'Copy the generated list — like - [Getting Started](#getting-started) — into the top of your README, or turn on "insert inline" to drop it between <!-- TOC --> markers and download document-with-toc.md.',
      },
    ],
    faqs: [
      {
        q: 'How are the anchor links generated?',
        a: 'It uses GitHub-style slugs: the heading is lowercased, spaces become hyphens and punctuation is removed, so "## Getting Started" links to #getting-started. Duplicate headings get a numeric suffix (-2, -3) to stay unique, matching GitHub’s behavior.',
      },
      {
        q: 'Can I limit which heading levels appear?',
        a: 'Yes. Set a start level and a max depth — for example H2 to H3 — to skip the H1 title and ignore very deep H4+ headings, keeping the TOC focused.',
      },
      {
        q: 'Does it pick up # symbols inside code blocks?',
        a: 'No. Lines inside fenced code blocks (``` … ```) are skipped, so a comment like # this is code in a shell snippet won’t be mistaken for a heading.',
      },
    ],
  },

  'video-to-gif': {
    metaTitle: 'Video to GIF Converter — Clip a Segment to GIF',
    metaDescription:
      'Convert a segment of a video into a high-quality GIF in your browser. Set start/end, FPS and width, add reverse or ping-pong. MP4, WebM, MOV supported. Free, no upload.',
    intro:
      'This video-to-GIF converter turns a chosen segment of a video into an animated GIF. Pick a start and end (say 0–3s), set the frame rate and width, and optionally reverse or ping-pong the clip. It uses FFmpeg.wasm with a 2-pass palette for clean color — and runs entirely in your browser, so the video is never uploaded.',
    features: [
      'Clip any segment by start/end time instead of converting the whole video.',
      'Control frame rate (5–30 FPS) and output width to balance smoothness and file size.',
      'High-quality 2-pass palette encoding for accurate GIF colors.',
      'Effects: normal, reverse, or ping-pong (play forward then backward).',
      'FFmpeg.wasm runs locally; supports MP4, WebM, MOV, AVI and MKV with no upload.',
    ],
    steps: [
      {
        title: 'Upload a video',
        body: 'Drop in an MP4, WebM or MOV. The first run downloads FFmpeg.wasm (~30MB, then cached). Use the built-in player to find the moment you want.',
      },
      {
        title: 'Set the segment and quality',
        body: 'Enter a start and end — e.g. 00:00 to 00:03 for a 3-second clip — then tune FPS (12 is a good default) and width (320–480 px keeps the file reasonable). Add a reverse or ping-pong effect if you like.',
      },
      {
        title: 'Convert and download',
        body: 'Click "convert to GIF". A preview appears with its file size; download it as a .gif. A short, narrow, lower-FPS clip stays small; long or wide clips grow quickly.',
      },
    ],
    faqs: [
      {
        q: 'Why is my GIF file so large?',
        a: 'GIF is an old, inefficient format — every frame is stored almost in full. File size scales with duration × FPS × width. To shrink it, keep clips to a few seconds, drop FPS to 10–15, and reduce the width to 320–480 px. For long clips, a video format like MP4 is far smaller.',
      },
      {
        q: 'How long a clip can I convert?',
        a: 'Technically any length, but GIFs balloon fast. The sweet spot is 2–6 seconds. The tool lets you pick exact start/end times so you can grab just the moment you need rather than the whole video.',
      },
      {
        q: 'What does the ping-pong effect do?',
        a: 'Ping-pong plays the clip forward, then backward, so it loops seamlessly without a jump. Reverse simply plays it backward once. Both are great for short reaction-style loops.',
      },
    ],
  },

  'docx-to-pdf': {
    metaTitle: 'Word to PDF Converter (.docx to PDF) — Free, No Upload',
    metaDescription:
      'Convert a Word .docx to PDF in your browser. Renders the document to A4 pages and exports a PDF — no Microsoft Office, no signup, files never uploaded.',
    intro:
      'This tool converts a Word .docx into a PDF entirely in your browser. It reads the document with mammoth, lays the content out on A4-width pages, and exports a PDF you can download. It is built for text-heavy documents like reports, letters and resumes rather than pixel-perfect designed layouts.',
    features: [
      'Reads .docx directly — no Microsoft Word or Office install needed.',
      'Outputs standard A4 portrait pages, paginated automatically for multi-page documents.',
      'Keeps headings, paragraphs, lists, bold/italic and inline images from the source.',
      'Sanitizes the document HTML (DOMPurify) before rendering, so a malicious .docx can not run scripts.',
      'Converts in your browser — the .docx is never uploaded to a server.',
    ],
    steps: [
      {
        title: 'Drop in your .docx file',
        body: 'Select or drag a Word file such as report.docx. Only the modern .docx format is supported — older .doc files should be re-saved as .docx in Word first.',
      },
      {
        title: 'Let it render the pages',
        body: 'The document is converted to HTML and laid out on 595pt-wide A4 pages. A long report simply flows onto additional pages automatically.',
      },
      {
        title: 'Download the PDF',
        body: 'Click download to save report.pdf. Open it in any viewer to confirm the page breaks look right before sharing or printing.',
      },
    ],
    faqs: [
      {
        q: 'Is the original formatting kept?',
        a: 'Common formatting is preserved — headings, paragraphs, bullet/numbered lists, bold, italic and inline images. Because the page is rendered and rasterized into the PDF, exact fonts, precise column layouts, headers/footers and complex tables may shift or simplify. For text-heavy documents the result is faithful.',
      },
      {
        q: 'Are tables and images included?',
        a: 'Yes. Inline images embedded in the .docx and simple tables come through. Very wide tables can be clipped to the A4 width, so check the output if your document has large grids.',
      },
      {
        q: 'Is the text selectable in the PDF?',
        a: 'The page is captured as an image per page, so text in the PDF is not selectable or searchable. If you need selectable text, that is a limitation of this in-browser approach.',
      },
      {
        q: 'Why is only .docx supported, not .doc?',
        a: '.docx is an open XML format that can be parsed in the browser; the old binary .doc format can not. Open a .doc in Word or Google Docs and "Save as" .docx, then convert.',
      },
    ],
  },

  'video-convert': {
    metaTitle: 'Video Converter (MP4, WebM, MOV, AVI, MKV) — In Browser',
    metaDescription:
      'Convert video between MP4, WebM, MOV, AVI and MKV in your browser with FFmpeg. Turn a .mov into .mp4 (H.264) or .webm (VP9) — no upload, no install.',
    intro:
      'This video converter changes a clip between MP4, WebM, MOV, AVI and MKV using FFmpeg compiled to WebAssembly, all inside your browser. Pick MP4 and it re-encodes to H.264; pick WebM and it uses VP9. Nothing is uploaded — the whole file is processed on your own machine.',
    features: [
      'Converts to MP4 (H.264/AAC), WebM (VP9), MOV, AVI and MKV.',
      'Quality slider (CRF) so you can trade file size against visual quality.',
      'Runs FFmpeg.wasm locally — your video never leaves the browser.',
      'Pre-fills the target format from a /convert/* deep link (e.g. mov-to-mp4).',
      'Shows duration and resolution so you know what you are converting.',
    ],
    steps: [
      {
        title: 'Load your video',
        body: 'Drop in a file such as clip.mov. The tool reads its duration and resolution; large files (hundreds of MB) take more time and memory, so a short test clip is a good first try.',
      },
      {
        title: 'Choose the target format and quality',
        body: 'Pick MP4 to get a universally compatible H.264 file, or WebM for a smaller VP9 file. Adjust the CRF/quality if you want a smaller or sharper result.',
      },
      {
        title: 'Convert and download',
        body: 'Start the conversion and watch the progress bar. When it finishes, download clip.mp4. Re-encoding a minute of HD video can take a while in the browser — this is normal.',
      },
    ],
    faqs: [
      {
        q: 'Why is the conversion slow?',
        a: 'It re-encodes the whole video using FFmpeg compiled to WebAssembly, running on your CPU inside the browser tab — there is no fast server or GPU doing the work. A few minutes of HD footage can take several minutes. The trade-off is that your file is never uploaded.',
      },
      {
        q: 'MP4 vs WebM — which should I pick?',
        a: 'MP4 (H.264) plays virtually everywhere — phones, editors, social platforms. WebM (VP9) is more efficient for the same quality and ideal for the web, but support is slightly narrower. Choose MP4 for maximum compatibility, WebM for smaller web files.',
      },
      {
        q: 'Is there a file-size limit?',
        a: 'There is no hard cap, but everything runs in browser memory, so very large files (over ~1GB) may run out of memory or crash the tab. For big videos, trim or compress first, or use a desktop tool.',
      },
    ],
  },

  'video-compress': {
    metaTitle: 'Compress Video Online (Reduce MP4 Size) — No Upload',
    metaDescription:
      'Shrink a video file in your browser with FFmpeg. Use 720p/CRF 26 for a balanced size or 480p/CRF 30 for tiny files — H.264, no upload, no signup.',
    intro:
      'This tool reduces video file size in your browser by re-encoding with H.264 at a higher CRF and optionally scaling down the resolution. The Balanced preset (720p, CRF 26) typically cuts size dramatically with little visible loss, while Small (480p, CRF 30) goes much smaller. All processing happens locally with FFmpeg.wasm.',
    features: [
      'Three presets — High (1080p, CRF 20), Balanced (720p, CRF 26), Small (480p, CRF 30).',
      'Custom mode to set your own CRF and max height.',
      'Shows the before/after size and the percentage saved.',
      'Re-encodes to H.264 MP4 for broad compatibility.',
      'Compresses in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Add the video to compress',
        body: 'Drop in a file like recording.mp4. The tool reads its resolution and duration so you can judge how much to scale down.',
      },
      {
        title: 'Pick a preset',
        body: 'Choose Balanced (720p, CRF 26) for a good size-to-quality trade-off, or Small (480p, CRF 30) when you need the smallest file — for example to fit an email attachment limit.',
      },
      {
        title: 'Compress and compare',
        body: 'Run it and watch the progress. When done, the result card shows the new size and percent saved (e.g. 80MB to 22MB, -72%). Download if you are happy with it.',
      },
    ],
    faqs: [
      {
        q: 'Will compressing lose quality?',
        a: 'Yes, some — H.264 with a higher CRF is lossy, and lowering resolution discards detail. But at CRF 26 / 720p the loss is usually hard to notice for everyday footage, while the file shrinks a lot. Use CRF 20 / 1080p if you want to keep more quality.',
      },
      {
        q: 'What does CRF mean?',
        a: 'CRF (Constant Rate Factor) controls quality versus size — lower is higher quality and bigger, higher is smaller and lower quality. Roughly: 18 is near-lossless, 23 is a good default, and 28+ is noticeably compressed.',
      },
      {
        q: 'Why does it take a while?',
        a: 'Compression re-encodes every frame using FFmpeg.wasm on your CPU inside the browser, so a long or high-resolution clip can take several minutes. Nothing is uploaded, which is the upside of doing it locally.',
      },
    ],
  },

  'video-trim': {
    metaTitle: 'Trim Video Online (Cut a Clip) — Fast, No Upload',
    metaDescription:
      'Cut a segment out of a video in your browser. Set start/end like 00:10 to 00:25 and keep just that part — fast stream-copy mode or precise re-encode, no upload.',
    intro:
      'This tool cuts a chosen segment out of a video right in your browser using FFmpeg. Set a start and end time — say 00:10 to 00:25 — and export just that 15-second clip. A fast "copy" mode trims without re-encoding, while "re-encode" gives frame-accurate cuts.',
    features: [
      'Pick exact start/end times to keep only the part you want.',
      'Fast copy mode (-c copy) trims almost instantly without re-encoding.',
      'Re-encode mode (H.264) for frame-accurate cuts that start exactly where you set.',
      'Keeps the original audio track in the trimmed clip.',
      'Trims in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Load the video and set the range',
        body: 'Drop in clip.mp4 and enter the start and end, for example 00:10 to 00:25 to keep that 15-second span.',
      },
      {
        title: 'Choose copy or re-encode',
        body: 'Copy mode is near-instant but cuts on the nearest keyframe, so the start may be slightly off. Re-encode is slower but starts exactly on your chosen frame — pick it when timing matters.',
      },
      {
        title: 'Export the trimmed clip',
        body: 'Run the trim and download the result. In copy mode a long video is trimmed in seconds because no frames are re-compressed.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between copy and re-encode?',
        a: 'Copy mode (-c copy) extracts the segment without re-compressing, so it is extremely fast and lossless — but it can only cut on keyframes, so the start may jump to slightly before your mark. Re-encode rebuilds the frames for a frame-accurate cut, at the cost of time and a tiny quality loss.',
      },
      {
        q: 'Why does my cut start a bit early in copy mode?',
        a: 'Stream copy can only start at a keyframe (often every 1-5 seconds). To start exactly on the time you set, switch to re-encode mode.',
      },
      {
        q: 'Is the audio kept?',
        a: 'Yes. The audio track within the trimmed range is preserved alongside the video in the exported clip.',
      },
    ],
  },

  'video-to-audio': {
    metaTitle: 'Extract Audio from Video (Video to MP3) — No Upload',
    metaDescription:
      'Pull the audio out of a video in your browser. Convert an MP4 to MP3, WAV, AAC or OGG — grab a song or podcast track from a clip with no upload, no signup.',
    intro:
      'This tool extracts the audio track from a video and saves it as MP3, WAV, AAC or OGG, all in your browser with FFmpeg. Drop in an MP4 and get back just the sound — useful for ripping a podcast, lecture or music track out of a video file. Nothing is uploaded.',
    features: [
      'Outputs MP3, WAV (lossless PCM), AAC or OGG (Vorbis).',
      'Extracts the full audio track from MP4, MOV, WebM, MKV and more.',
      'Warns clearly if the video has no audio track to extract.',
      'Shows the source duration so you know the audio length.',
      'Extracts in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Load the video',
        body: 'Drop in a file like talk.mp4. If the video has no audio track, the tool tells you instead of producing an empty file.',
      },
      {
        title: 'Choose the audio format',
        body: 'Pick MP3 for a small, universally playable file, or WAV if you need uncompressed audio for editing. AAC and OGG are also available.',
      },
      {
        title: 'Extract and download',
        body: 'Run it and download talk.mp3. The whole video is decoded to pull out the audio, so a long file takes a little time.',
      },
    ],
    faqs: [
      {
        q: 'Does this re-compress the audio?',
        a: 'It re-encodes to the format you choose. MP3, AAC and OGG are lossy, so they re-compress; WAV is lossless PCM and keeps full quality but is much larger. For sharing pick MP3; for editing pick WAV.',
      },
      {
        q: 'What if the video has no sound?',
        a: 'The tool detects a missing audio track and shows a message rather than exporting a silent or empty file, so you know the source itself has no audio.',
      },
      {
        q: 'Can I keep the original audio quality?',
        a: 'Choose WAV to avoid re-compression entirely (lossless), or pick MP3/AAC at a high bitrate for a much smaller file with minimal audible loss.',
      },
    ],
  },

  'audio-convert': {
    metaTitle: 'Audio Converter (MP3, WAV, OGG, AAC, M4A, FLAC)',
    metaDescription:
      'Convert audio between MP3, WAV, OGG, AAC, M4A and FLAC in your browser. Turn a WAV into MP3 or a FLAC into WAV with FFmpeg — no upload, no signup.',
    intro:
      'This audio converter changes a sound file between MP3, WAV, OGG, AAC, M4A and FLAC using FFmpeg in your browser. Convert a bulky WAV to a small MP3, or a FLAC to WAV for editing. The conversion runs locally, so your audio is never uploaded.',
    features: [
      'Converts MP3, WAV, OGG, AAC, M4A and FLAC in any direction.',
      'Handles lossless (WAV, FLAC) and lossy (MP3, AAC, OGG) targets.',
      'Pre-fills the target format from a /convert/* deep link (e.g. wav-to-mp3).',
      'Accepts common inputs including .opus and .wma.',
      'Converts in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Add your audio file',
        body: 'Drop in a file such as song.wav. Inputs like MP3, WAV, OGG, AAC, M4A, FLAC, Opus and WMA are accepted.',
      },
      {
        title: 'Pick the output format',
        body: 'Choose MP3 to shrink a WAV for sharing, or WAV/FLAC if you need a lossless file for editing. The tool marks which targets are lossy.',
      },
      {
        title: 'Convert and download',
        body: 'Run the conversion and download song.mp3. A typical song converts in a few seconds in the browser.',
      },
    ],
    faqs: [
      {
        q: 'Does converting to MP3 lose quality?',
        a: 'Yes — MP3, AAC and OGG are lossy, so re-encoding to them discards some audio data. Converting between lossless formats (WAV to FLAC) keeps full quality. Going from MP3 back to WAV does not restore the quality already lost.',
      },
      {
        q: 'Which format should I use?',
        a: 'MP3 for maximum compatibility and small size; WAV for uncompressed editing; FLAC for lossless archiving at smaller size than WAV; AAC/M4A for Apple devices; OGG for open-web use.',
      },
      {
        q: 'Can it convert FLAC to MP3?',
        a: 'Yes. Load the FLAC, pick MP3, and convert. This is a common way to make a lossless library portable, at the cost of MP3 being lossy.',
      },
    ],
  },

  'audio-trim': {
    metaTitle: 'Trim Audio Online (Cut MP3 / WAV) — Fast, No Upload',
    metaDescription:
      'Cut a section out of an audio file in your browser. Set start/end like 00:05 to 00:35 to make a ringtone or sample — fast lossless copy, no upload, no signup.',
    intro:
      'This tool cuts a segment out of an audio file in your browser using FFmpeg. Set a start and end — for example 00:05 to 00:35 — to grab a 30-second sample, ringtone or clean intro. It trims with stream copy, so the cut is fast and lossless.',
    features: [
      'Set exact start/end times to keep just the part you want.',
      'Lossless stream copy (-c copy) — no re-encoding, no quality loss.',
      'Works with MP3, WAV, OGG, AAC, M4A and FLAC.',
      'Defaults the end to a short clip so you can quickly grab a sample.',
      'Trims in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Load the audio and set the range',
        body: 'Drop in song.mp3 and enter the start and end, for example 00:05 to 00:35 for a 30-second cut.',
      },
      {
        title: 'Check the segment',
        body: 'Confirm the times capture exactly the part you want — a chorus, a sample, or a clean section without the intro.',
      },
      {
        title: 'Export the clip',
        body: 'Run the trim and download the result. Because it uses stream copy, even a long track is cut in a moment with no quality change.',
      },
    ],
    faqs: [
      {
        q: 'Does trimming reduce audio quality?',
        a: 'No. It uses stream copy (-c copy), which extracts the segment without re-encoding, so the trimmed clip is bit-for-bit identical in quality to the original within that range.',
      },
      {
        q: 'Can I make a ringtone with this?',
        a: 'Yes — set the range to the section you want (typically under 30-40 seconds) and export. You can then convert it to the format your phone needs with the audio converter.',
      },
      {
        q: 'Why might the cut start slightly off?',
        a: 'Stream copy cuts on the nearest frame boundary for some compressed formats, so the start can be a fraction of a second off. For most music and voice clips this is imperceptible.',
      },
    ],
  },

  'gif-maker': {
    metaTitle: 'GIF Maker — Turn Images into an Animated GIF (Free)',
    metaDescription:
      'Combine PNG/JPEG images into an animated GIF in your browser. Set frame delay (e.g. 200ms) and width (e.g. 480px), loop it, and export — no upload, no signup.',
    intro:
      'This GIF maker stitches a set of PNG or JPEG images into an animated GIF, right in your browser with FFmpeg. Add your frames in order, set the per-frame delay (e.g. 200ms) and output width (e.g. 480px), and export a looping GIF. Everything is processed locally.',
    features: [
      'Builds an animated GIF from multiple PNG/JPEG frames.',
      'Adjustable frame delay (e.g. 200ms ≈ 5 fps) controls playback speed.',
      'Set output width (e.g. 480px) — height scales automatically with Lanczos.',
      'Optional infinite loop, with a quality palette (palettegen) for clean colors.',
      'Builds the GIF in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Add your frames',
        body: 'Drop in your images (frame1.png, frame2.png, …). They are sequenced in order, so name or arrange them the way you want them to play.',
      },
      {
        title: 'Set delay, width and loop',
        body: 'Choose a frame delay — 200ms gives ~5 frames per second — and a width like 480px. Enable looping for a GIF that repeats forever.',
      },
      {
        title: 'Generate and download',
        body: 'Create the GIF and download out.gif. If it looks too big, reduce the width or use fewer frames and re-export.',
      },
    ],
    faqs: [
      {
        q: 'Can I make a GIF from a video here?',
        a: 'This tool builds a GIF from still images. To convert a video clip into a GIF, use the dedicated Video to GIF tool instead — it lets you pick a time range from the video.',
      },
      {
        q: 'Why is the GIF file so large?',
        a: 'GIF stores each frame almost in full and supports only 256 colors per frame, so size grows with frame count × width. To shrink it, use fewer frames, a smaller width (320-480px), or a longer per-frame delay. Optimizing afterward helps too.',
      },
      {
        q: 'How do I control the speed?',
        a: 'Speed comes from the frame delay: 100ms is ~10 fps (faster), 200ms is ~5 fps, 500ms is slow. Lower the delay for snappier animation, raise it for a slideshow feel.',
      },
    ],
  },

  'gif-optimize': {
    metaTitle: 'GIF Optimizer — Reduce GIF File Size Online (Free)',
    metaDescription:
      'Shrink an animated GIF in your browser. Cut colors (256 to 64), scale down, and drop frame rate to make a GIF much smaller — FFmpeg, no upload, no signup.',
    intro:
      'This tool reduces the file size of an animated GIF in your browser using FFmpeg. It works by lowering the color palette (e.g. 256 to 128 or 64 colors), scaling the dimensions down, and optionally dropping the frame rate. A Medium preset typically cuts size sharply with little visible change.',
    features: [
      'Three presets — Light (256 colors), Medium (128 colors, 80%), Strong (64 colors, 60%, 10fps).',
      'Reduce the color palette and scale percentage to control size vs quality.',
      'Optional frame-rate cap to drop redundant frames.',
      'Shows before/after size and the percentage saved.',
      'Optimizes in your browser with FFmpeg.wasm — no upload.',
    ],
    steps: [
      {
        title: 'Add the GIF to optimize',
        body: 'Drop in animation.gif. The tool reads its size so you can see how much you save after optimizing.',
      },
      {
        title: 'Pick a preset or tune it',
        body: 'Try Medium (128 colors, 80% scale) first. If you need it smaller, go to Strong (64 colors, 60%, 10fps) or lower the colors and scale manually.',
      },
      {
        title: 'Optimize and compare',
        body: 'Run it and check the result card — for example 4MB down to 1.2MB (-70%). Download if the quality still looks good.',
      },
    ],
    faqs: [
      {
        q: 'How does reducing colors shrink the file?',
        a: 'A GIF stores a color palette of up to 256 colors. Cutting it to 128 or 64 means fewer bits per pixel and a smaller palette, which can dramatically reduce size. Dithering keeps the result looking smooth despite fewer colors.',
      },
      {
        q: 'Will optimizing hurt quality?',
        a: 'Some — fewer colors and smaller dimensions are visible if you push them hard. Medium settings usually look almost identical to the original. For photographic GIFs, color banding can appear at very low color counts.',
      },
      {
        q: 'Should I use a GIF at all for long clips?',
        a: 'For anything longer than a few seconds, an MP4 or WebM video is far smaller and sharper than even an optimized GIF. Use GIF for short, silent, autoplay-everywhere loops.',
      },
    ],
  },

  'favicon-gen': {
    metaTitle: 'Favicon Generator — 16/32/180px PNG + ICO (Free)',
    metaDescription:
      'Generate a full favicon set from one image in your browser. Get 16, 32, 48, 64, 180, 192, 512px PNGs plus a multi-size favicon.ico in a ZIP — no upload.',
    intro:
      'This favicon generator turns a single image into a complete favicon set in your browser. From one source it produces 16, 32, 48, 64, 180, 192 and 512px PNGs plus a multi-size favicon.ico (16/32/48), packaged as a ZIP. It covers browser tabs, the iOS home-screen icon and Android/PWA icons at once.',
    features: [
      'One image in, a full set out: 16, 32, 48, 64, 180, 192 and 512px PNGs.',
      'Packs a real multi-size favicon.ico (16/32/48) — not just a renamed PNG.',
      'Includes the 180px apple-touch-icon and 192/512px PWA icons.',
      'Downloads everything as a single favicon.zip, or grab just favicon.ico.',
      'Generates in your browser with the Canvas API — no upload.',
    ],
    steps: [
      {
        title: 'Upload your source image',
        body: 'Use a square image, ideally 512x512px or larger (e.g. logo.png), so the smallest 16px icon stays crisp after downscaling.',
      },
      {
        title: 'Generate the set',
        body: 'The tool renders every size with high-quality smoothing and packs the ICO. You will see 16, 32, 48, 64, 180, 192 and 512px outputs plus favicon.ico.',
      },
      {
        title: 'Download and install',
        body: 'Grab favicon.zip, drop the files in your site root, and reference them: <link rel="icon" href="/favicon.ico"> and <link rel="apple-touch-icon" href="/favicon-180x180.png">.',
      },
    ],
    faqs: [
      {
        q: 'Which favicon sizes do I actually need?',
        a: 'The essentials are 16x16 and 32x32 for browser tabs (bundled into favicon.ico), 180x180 for the iOS apple-touch-icon, and 192/512 for Android and PWA manifests. This tool produces all of them so you are covered.',
      },
      {
        q: 'What is the favicon.ico for?',
        a: 'favicon.ico is the classic browser-tab icon, and it can hold several sizes (here 16/32/48) in one file so the browser picks the sharpest. This generator builds a true multi-size ICO, not just a renamed PNG.',
      },
      {
        q: 'Should my source image be square?',
        a: 'Yes. Use a square image (512x512 or larger) so it scales cleanly to every size. A non-square image will be fit into a square, which can leave padding or look off at small sizes.',
      },
    ],
  },

  'meme-gen': {
    metaTitle: 'Meme Generator — Impact Top/Bottom Text (Free)',
    metaDescription:
      'Make a classic meme in your browser. Add bold white Impact captions with a black outline at the top and bottom of any image, then download — no upload, no signup.',
    intro:
      'This meme generator adds the classic top and bottom captions to any image, right in your browser. It uses bold uppercase Impact text with a black outline — the iconic meme look — sized automatically to the image, and exports a ready-to-share PNG. Nothing is uploaded.',
    features: [
      'Top and bottom captions in bold Impact with a black stroke — the classic meme style.',
      'Font size scales to the image (about 10% of the short side) so text fits any photo.',
      'Renders on a Canvas and exports a shareable image.',
      'Works with your own photos, screenshots or reaction images.',
      'Generates in your browser with the Canvas API — no upload.',
    ],
    steps: [
      {
        title: 'Upload your image',
        body: 'Drop in the picture you want to caption — a reaction shot, screenshot or photo such as cat.jpg.',
      },
      {
        title: 'Type the top and bottom text',
        body: 'Enter your caption, for example "ONE DOES NOT SIMPLY" on top and "WALK INTO MORDOR" on the bottom. It is rendered in white Impact with a black outline.',
      },
      {
        title: 'Download the meme',
        body: 'Export the result as an image and share it. Re-edit the text and re-export as many times as you like.',
      },
    ],
    faqs: [
      {
        q: 'Why is the font Impact?',
        a: 'Impact (bold, white, black-outlined, uppercase) is the font that defined the classic image-macro meme in the 2000s, so it instantly reads as "meme". This tool falls back to Arial Black / Anton if Impact is unavailable on your system.',
      },
      {
        q: 'Can I add only a bottom caption?',
        a: 'Yes. Leave the top text empty and fill in just the bottom (or vice versa). Empty captions are simply not drawn.',
      },
      {
        q: 'Can I use my own photo?',
        a: 'Absolutely — upload any image you have. Since everything stays in your browser, even private screenshots and personal photos never leave your device.',
      },
    ],
  },

  'json-to-ts': {
    metaTitle: 'JSON to TypeScript — Generate Interfaces from JSON',
    metaDescription:
      'Paste JSON and get TypeScript interfaces instantly. Infers types from values, marks nullable fields, and names a Root interface — all in your browser, no signup.',
    intro:
      'This tool turns a JSON sample into TypeScript interfaces in your browser. Paste an API response and it infers the type of every field, names nested objects, and produces a typed Root interface you can drop straight into your code. A null value becomes a `| null` union automatically.',
    features: [
      'Infers TypeScript types from your JSON values (string, number, boolean, arrays, nested objects).',
      'Generates named interfaces for nested objects, not one giant inline type.',
      'Handles null by widening the field to a nullable type.',
      'Custom root name — call the top interface Root, User, ApiResponse, anything.',
      'Generates in your browser — your JSON is never uploaded.',
    ],
    steps: [
      {
        title: 'Paste your JSON',
        body: 'Drop in a sample such as {"id":1,"name":"Ada","profile":{"age":30,"city":null}}. A real API response works great.',
      },
      {
        title: 'Name the root interface',
        body: 'Set the root name — for example User. Nested objects get their own interfaces named after their keys (e.g. Profile).',
      },
      {
        title: 'Copy the generated types',
        body: 'The output appears instantly: interface User with id: number, name: string, and profile: Profile where city is string | null. Copy it into your .ts file.',
      },
    ],
    faqs: [
      {
        q: 'How are types inferred?',
        a: 'Each value is inspected: numbers become number, strings become string, true/false become boolean, arrays become T[] based on their elements, and objects become their own named interface. It is sample-based, so the more representative your JSON, the better the types.',
      },
      {
        q: 'What happens with null values?',
        a: 'A null value can not reveal its real type, so the field is widened — typically to a nullable union like string | null. Provide a non-null example if you want a precise type.',
      },
      {
        q: 'Does it handle nested objects and arrays?',
        a: 'Yes. Nested objects get their own interfaces (e.g. profile: Profile), and arrays are typed from their items (e.g. number[] or User[]). Deeply nested JSON produces a clean set of linked interfaces.',
      },
    ],
  },

  'css-gradient': {
    metaTitle: 'CSS Gradient Generator (Linear & Radial) — Free',
    metaDescription:
      'Build CSS gradients visually and copy the code. Create linear-gradient(90deg, ...) or radial-gradient(circle, ...) with custom color stops — free, no signup.',
    intro:
      'This CSS gradient generator lets you build a linear or radial gradient visually and copy the exact CSS. Add color stops, set the angle for linear gradients, and watch a live preview update. The output is ready-to-paste code like `linear-gradient(90deg, #ff0000, #0000ff)`.',
    features: [
      'Linear and radial gradient types.',
      'Add and edit multiple color stops for multi-color gradients.',
      'Angle control for linear gradients (e.g. 90deg = left to right).',
      'Live preview and one-click copy of the generated CSS.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Choose linear or radial',
        body: 'Pick Linear for a directional fade or Radial for a circular fade from the center outward.',
      },
      {
        title: 'Set the stops and angle',
        body: 'Add color stops — for example #ff0000 at 0% and #0000ff at 100% — and, for linear, set the angle (90deg goes left to right, 180deg top to bottom).',
      },
      {
        title: 'Copy the CSS',
        body: 'Copy the generated value, e.g. background: linear-gradient(90deg, #ff0000, #0000ff);, and paste it into your stylesheet.',
      },
    ],
    faqs: [
      {
        q: 'What does the angle mean in a linear gradient?',
        a: 'The angle sets the direction the colors flow. 0deg goes bottom to top, 90deg left to right, 180deg top to bottom, and 45deg diagonally. So linear-gradient(90deg, ...) fades from the left edge to the right.',
      },
      {
        q: 'How do I add more than two colors?',
        a: 'Add more color stops. Each stop is a color and an optional position, so linear-gradient(90deg, red 0%, yellow 50%, green 100%) gives a three-color gradient. This tool lets you add as many stops as you need.',
      },
      {
        q: 'What is the difference between linear and radial?',
        a: 'A linear gradient fades along a straight line in the direction of the angle. A radial gradient fades outward in a circle (or ellipse) from a center point — good for spotlight or glow effects.',
      },
    ],
  },

  'color-contrast': {
    metaTitle: 'WCAG Color Contrast Checker (AA / AAA) — Free',
    metaDescription:
      'Check WCAG contrast ratio between two colors. See if text passes AA (4.5:1 body, 3:1 large) and AAA (7:1) — e.g. #767676 on white passes AA. Free, no signup.',
    intro:
      'This tool calculates the WCAG contrast ratio between a foreground and background color and tells you which accessibility levels it passes. Enter a text color and a background — say #767676 on #ffffff — and see the ratio (4.54:1) along with AA/AAA pass or fail for normal and large text.',
    features: [
      'Computes the exact WCAG contrast ratio (1:1 to 21:1) using relative luminance.',
      'Shows AA and AAA pass/fail for both normal and large text.',
      'Clear thresholds: AA needs 4.5:1 body / 3:1 large, AAA needs 7:1 body / 4.5:1 large.',
      'Test any foreground/background pair before shipping a design.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Enter the two colors',
        body: 'Set the foreground (text) color and the background — for example #767676 text on a #ffffff background.',
      },
      {
        title: 'Read the ratio',
        body: 'The contrast ratio appears instantly, e.g. 4.54:1. Higher is more readable; pure black on white is the maximum 21:1.',
      },
      {
        title: 'Check the AA/AAA badges',
        body: 'See which levels pass. 4.54:1 passes AA for normal body text (needs 4.5:1) but fails AAA (needs 7:1). Adjust a color until it passes the level you target.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between AA and AAA?',
        a: 'They are WCAG conformance levels. AA (the common legal/practical target) requires 4.5:1 for normal text and 3:1 for large text. AAA is stricter — 7:1 for normal and 4.5:1 for large. Aim for AA at minimum; AAA where you can.',
      },
      {
        q: 'What counts as "large text"?',
        a: 'WCAG defines large text as 18pt (24px) or 14pt (18.66px) bold and above. Large text has a lower required ratio (3:1 for AA, 4.5:1 for AAA) because bigger glyphs are easier to read at lower contrast.',
      },
      {
        q: 'How is the ratio calculated?',
        a: 'It uses the relative luminance of each color (a weighted, gamma-corrected mix of R, G, B) and computes (lighter + 0.05) / (darker + 0.05). The result ranges from 1:1 (identical) to 21:1 (black on white).',
      },
    ],
  },

  'box-shadow': {
    metaTitle: 'CSS Box-Shadow Generator (inset, multiple) — Free',
    metaDescription:
      'Generate CSS box-shadow visually and copy the code. Set offset, blur, spread and color, toggle inset, and stack multiple shadows — free, no signup.',
    intro:
      'This box-shadow generator builds CSS box-shadow values visually and copies the code. Set the horizontal/vertical offset, blur radius, spread and color, toggle inset for inner shadows, and stack several shadows for layered depth. The live preview shows exactly what your element will look like.',
    features: [
      'Control offset-x, offset-y, blur and spread with live preview.',
      'Inset toggle for inner shadows instead of outer.',
      'Stack multiple shadows in one box-shadow for layered effects.',
      'Adjustable shadow color (and opacity) for soft, realistic shadows.',
      'Runs entirely in your browser with one-click copy.',
    ],
    steps: [
      {
        title: 'Set the offset and blur',
        body: 'Adjust offset-x, offset-y, blur and spread — for example 0 8px 16px 0 gives a soft shadow dropping straight down.',
      },
      {
        title: 'Pick a color and inset',
        body: 'Choose a shadow color (often black at low opacity, like rgba(0,0,0,0.2)). Toggle inset if you want the shadow inside the element instead of behind it.',
      },
      {
        title: 'Copy the CSS',
        body: 'Copy the value, e.g. box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);. Add more shadows for a stacked, layered look.',
      },
    ],
    faqs: [
      {
        q: 'What do the four numbers mean?',
        a: 'They are offset-x, offset-y, blur-radius and spread-radius. offset-x/y move the shadow horizontally/vertically, blur softens its edge, and spread grows or shrinks the shadow before blurring. So 0 8px 16px 0 means no horizontal offset, 8px down, 16px blur, no spread.',
      },
      {
        q: 'What does inset do?',
        a: 'inset draws the shadow inside the element, creating an inner/pressed look (like an inset input field), instead of the default drop shadow behind it.',
      },
      {
        q: 'Can I use multiple shadows on one element?',
        a: 'Yes. box-shadow accepts a comma-separated list, so you can layer several — for example a tight dark shadow plus a soft wide one — to build realistic depth. This tool lets you stack and copy them together.',
      },
    ],
  },

  'base-converter': {
    metaTitle: 'Base Converter (Binary, Octal, Decimal, Hex) — BigInt',
    metaDescription:
      'Convert numbers between base 2, 8, 10 and 16 in your browser. See 255 = 0xFF = 0b11111111 at once, with BigInt support for huge values — free, no signup.',
    intro:
      'This base converter translates a number between binary (2), octal (8), decimal (10) and hexadecimal (16) all at once. Enter 255 in decimal and instantly see 0xFF in hex and 0b11111111 in binary. It uses BigInt, so even numbers far beyond 2^53 convert exactly without rounding.',
    features: [
      'Converts between base 2, 8, 10 and 16 simultaneously — one input, all bases.',
      'BigInt-based, so very large integers convert exactly with no precision loss.',
      'Validates input per base (e.g. only 0-9 and a-f allowed for hex).',
      'Handy for color codes, bitmasks, permissions and low-level debugging.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Choose the input base',
        body: 'Pick the base of the number you are entering — for example Decimal (10) to type 255.',
      },
      {
        title: 'Type the number',
        body: 'Enter the value, e.g. 255. The tool checks it is valid for the chosen base (hex accepts 0-9 and a-f, binary only 0 and 1).',
      },
      {
        title: 'Read every base',
        body: 'All bases update at once: 255 = 0xFF (hex) = 0o377 (octal) = 0b11111111 (binary). Copy whichever representation you need.',
      },
    ],
    faqs: [
      {
        q: 'Does it handle very large numbers?',
        a: 'Yes. It uses JavaScript BigInt, so integers well beyond 2^53 (the safe limit for normal numbers) convert exactly with no rounding errors — useful for 64-bit values, hashes and large bitmasks.',
      },
      {
        q: 'What is 255 in hex and binary?',
        a: '255 in decimal is FF in hexadecimal (often written 0xFF) and 11111111 in binary (0b11111111). It is the largest value that fits in a single byte (8 bits), which is why it shows up so often in colors and bytes.',
      },
      {
        q: 'Why are some characters rejected?',
        a: 'Each base only allows certain digits: binary uses 0-1, octal 0-7, decimal 0-9, and hex 0-9 plus a-f. Typing a digit outside the chosen base (like 9 in binary, or g in hex) is flagged as invalid.',
      },
    ],
  },

  'number-to-words': {
    metaTitle: 'Number to Words Converter (English & Korean) — Free',
    metaDescription:
      'Spell out a number in words — English or Korean. Turn 1234 into "one thousand two hundred thirty-four" for cheques and forms — free, in-browser, no signup.',
    intro:
      'This tool spells out a number in words in English or Korean. Enter 1234 and get "one thousand two hundred thirty-four", or switch to Korean for 천이백삼십사. It is handy for writing amounts on cheques, contracts and invoices where the figure must appear in words.',
    features: [
      'English (short scale: thousand, million, billion) and Korean (만, 억, 조) output.',
      'Handles large numbers using grouped units in each language.',
      'Useful for cheques, legal documents and accessibility.',
      'Spells the integer part clearly so amounts are unambiguous.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Enter the number',
        body: 'Type the figure you want spelled out, for example 1234.',
      },
      {
        title: 'Pick the language',
        body: 'Choose English to get "one thousand two hundred thirty-four", or Korean for 천이백삼십사 (note Korean groups by 만 = 10,000).',
      },
      {
        title: 'Copy the words',
        body: 'The spelled-out form appears instantly. Copy it onto your cheque, invoice or form where words are required.',
      },
    ],
    faqs: [
      {
        q: 'Does it support both English and Korean?',
        a: 'Yes. English uses the short scale (thousand, million, billion, …) and Korean uses 10,000-based units (만, 억, 조, …), so 12345 is "twelve thousand three hundred forty-five" in English and 일만 이천삼백사십오 in Korean.',
      },
      {
        q: 'Why would I need numbers in words?',
        a: 'Cheques, contracts and invoices often require the amount in words to prevent tampering — it is much harder to alter "one thousand" than the digits 1000. It is also used for accessibility and formal documents.',
      },
      {
        q: 'How big a number can it spell?',
        a: 'It handles large values using each language\'s unit names (up to trillion-scale and beyond). Extremely large numbers still spell out, just with longer unit chains.',
      },
    ],
  },

  'roman-numeral': {
    metaTitle: 'Roman Numeral Converter (Arabic ↔ Roman) — Free',
    metaDescription:
      'Convert between Roman numerals and Arabic numbers. 2024 = MMXXIV, 4 = IV, 49 = XLIX. Validates standard form, range 1-3999 — free, in-browser, no signup.',
    intro:
      'This tool converts both ways between Arabic numbers and Roman numerals. Enter 2024 to get MMXXIV, or type XLIX to get 49. It follows standard subtractive notation (4 = IV, 9 = IX, 40 = XL) and validates Roman input, covering the classic range 1 to 3999.',
    features: [
      'Converts Arabic → Roman and Roman → Arabic.',
      'Uses standard subtractive form: 4 = IV, 9 = IX, 40 = XL, 90 = XC.',
      'Validates Roman input against the correct pattern (rejects IIII, VV, etc.).',
      'Covers the standard range 1-3999.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Choose the direction',
        body: 'Pick Arabic → Roman to convert a number, or Roman → Arabic to decode numerals.',
      },
      {
        title: 'Enter the value',
        body: 'Type a number like 2024, or Roman numerals like MMXXIV. For Roman input, only valid standard forms are accepted.',
      },
      {
        title: 'Read the result',
        body: 'See the conversion instantly: 2024 = MMXXIV, 1994 = MCMXCIV, 49 = XLIX. Copy whichever you need.',
      },
    ],
    faqs: [
      {
        q: 'Why is the maximum 3999?',
        a: 'Standard Roman numerals only go up to 3999 (MMMCMXCIX) because there is no single symbol for 5000 or 10000 in the common system — M (1000) is the largest, and you do not write more than three in a row (MMM = 3000). Numbers above 3999 require overlines, which are not part of standard notation.',
      },
      {
        q: 'How do subtractive numerals work?',
        a: 'A smaller symbol before a larger one subtracts: IV = 5-1 = 4, IX = 10-1 = 9, XL = 50-10 = 40, CM = 1000-100 = 900. This is why 4 is IV (not IIII) and 2024 is MMXXIV.',
      },
      {
        q: 'What does 2024 look like in Roman numerals?',
        a: '2024 is MMXXIV — MM (2000) + XX (20) + IV (4). For comparison, 2023 is MMXXIII and 2025 is MMXXV.',
      },
    ],
  },

  'morse-code': {
    metaTitle: 'Morse Code Translator (Text ↔ Morse) with Beep',
    metaDescription:
      'Translate text to Morse code and back, then play it as audible beeps. SOS = ... --- ..., A = .-, plus numbers and punctuation — free, in-browser, no signup.',
    intro:
      'This Morse code translator converts text to Morse and Morse back to text, and can play the result as audible beeps. Type SOS to get ... --- ..., or paste dots and dashes to decode them. It covers A-Z, 0-9 and common punctuation, with a built-in oscillator for playback.',
    features: [
      'Encodes text → Morse and decodes Morse → text.',
      'Audible beep playback of the Morse using the Web Audio API (no file needed).',
      'Supports letters, digits and punctuation (. , ? ! / @ and more).',
      'Classic examples just work: SOS = ... --- ..., HELLO = .... . .-.. .-.. ---.',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Type text or Morse',
        body: 'Enter plain text like SOS to encode, or paste Morse like ... --- ... to decode it back to letters.',
      },
      {
        title: 'Read the translation',
        body: 'The converted output appears instantly — SOS becomes ... --- ..., where letters are separated by spaces and words by a slash.',
      },
      {
        title: 'Play the beeps',
        body: 'Press play to hear the Morse as oscillator tones — short beeps for dots, long for dashes — so you can learn the rhythm by ear.',
      },
    ],
    faqs: [
      {
        q: 'What is SOS in Morse code?',
        a: 'SOS is ... --- ... — three dots, three dashes, three dots. It is the international distress signal, chosen because the pattern is simple and unmistakable, not because the letters stand for anything.',
      },
      {
        q: 'How are letters and words separated?',
        a: 'Within a letter, dots and dashes are tight; letters are separated by a space; and words are separated by a slash (/) or longer gap. So "HI THERE" encodes as .... .. / - .... . .-. ..',
      },
      {
        q: 'Can I hear what the Morse sounds like?',
        a: 'Yes. The built-in playback uses the Web Audio API to beep the code — short tones for dots and longer tones for dashes — which is the easiest way to learn Morse rhythm.',
      },
    ],
  },

  'caesar-cipher': {
    metaTitle: 'Caesar Cipher & ROT13 Encoder/Decoder — Free',
    metaDescription:
      'Encrypt and decrypt text with a Caesar cipher or ROT13 in your browser. Shift letters by any amount — ROT13 = shift 13, decodes itself — free, no signup.',
    intro:
      'This tool encrypts and decrypts text with a Caesar cipher — shifting each letter by a fixed amount — and includes a one-click ROT13 (shift 13). Set the shift to 3 and "HELLO" becomes "KHOOR"; click ROT13 and the same operation both encodes and decodes. Only letters move; numbers, spaces and punctuation pass through unchanged.',
    features: [
      'Caesar cipher with any shift amount (positive or negative).',
      'One-click ROT13 button (shift 13) — the classic self-reversing cipher.',
      'Preserves letter case and leaves digits, spaces and symbols untouched.',
      'Decrypt by entering the negative shift (or ROT13 again).',
      'Runs entirely in your browser with no signup.',
    ],
    steps: [
      {
        title: 'Enter your text',
        body: 'Type or paste the message, for example HELLO.',
      },
      {
        title: 'Set the shift',
        body: 'Choose a shift amount — 3 turns HELLO into KHOOR. Or click the ROT13 button to apply a shift of 13.',
      },
      {
        title: 'Read or reverse it',
        body: 'The result updates live. To decode, enter the negative shift (-3) — or for ROT13, just apply ROT13 again, since it reverses itself.',
      },
    ],
    faqs: [
      {
        q: 'What is ROT13?',
        a: 'ROT13 is a Caesar cipher with a shift of 13. Because the alphabet has 26 letters, shifting twice returns the original — so the same ROT13 operation both encodes and decodes. It is commonly used to hide spoilers or punchlines, not for real security.',
      },
      {
        q: 'Is a Caesar cipher secure?',
        a: 'No. With only 25 possible shifts it can be broken in seconds by trying them all (or by letter-frequency analysis). Treat it as a fun puzzle or obfuscation, never as real encryption.',
      },
      {
        q: 'How do I decrypt a Caesar message?',
        a: 'Apply the opposite shift. If it was encrypted with shift 3, decrypt with shift -3 (or shift 23). For ROT13, simply run ROT13 again because it is its own inverse.',
      },
    ],
  },

  'html-format': {
    metaTitle: 'HTML Formatter — Beautify & Minify HTML Online',
    metaDescription:
      'Beautify messy HTML with clean indentation, or minify it to one line. Paste <section><h2>Title</h2></section> and get readable nested markup. Free, no signup.',
    intro:
      'This HTML formatter has two modes: Beautify re-indents tangled markup into clean nested lines, and Minify collapses it to a single line to shrink the file. Paste a one-line <section class="card"><h2>Title</h2><p>Body</p></section> and Beautify turns it into properly indented tags; switch to Minify to strip the whitespace back out. The contents of pre, script, style and textarea are left exactly as written.',
    features: [
      'Beautify mode re-indents nested tags so the structure is readable at a glance.',
      'Minify mode collapses markup to one line, removing the whitespace between tags.',
      'Preserves the inside of pre, script, style and textarea byte-for-byte (no broken code).',
      'Copy the result or download it as a .html file in one click.',
      'Runs entirely in your browser — large files are formatted without freezing the page.',
    ],
    steps: [
      {
        title: 'Paste your HTML',
        body: 'Drop your markup into the input box — for example the one-liner <section class="card"><h2>Title</h2><p>Body</p></section>.',
      },
      {
        title: 'Pick Beautify or Minify',
        body: 'Choose Beautify to expand it into indented, readable lines, or Minify to compress everything onto a single line for a smaller file.',
      },
      {
        title: 'Copy or download',
        body: 'The result updates instantly. Click Copy to grab it, or Download to save formatted.html (or minified.html).',
      },
    ],
    faqs: [
      {
        q: 'Does minifying change how my page renders?',
        a: 'No. Minify only removes whitespace between tags; the rendered output is identical. The inside of pre, script, style and textarea — where whitespace is significant — is left untouched.',
      },
      {
        q: 'How much smaller does minifying make my HTML?',
        a: 'It depends on indentation, but heavily indented markup commonly shrinks 10–30%. For real bandwidth savings, gzip/Brotli compression on your server matters more, but minifying still helps.',
      },
      {
        q: 'Will it fix broken or invalid HTML?',
        a: 'It re-indents what you give it but does not repair structural errors. If a tag is unclosed, the beautified output will reflect that — use a validator to catch real mistakes.',
      },
    ],
  },

  'svg-optimize': {
    metaTitle: 'SVG Optimizer — Shrink SVG File Size Online',
    metaDescription:
      'Reduce SVG file size by stripping editor metadata, comments and extra whitespace, and rounding decimals. A 12 KB Illustrator export often drops below 4 KB. Free, no signup.',
    intro:
      'This SVG optimizer cuts file size by removing the bloat editors leave behind — comments, metadata blocks, redundant whitespace — and rounding long coordinate decimals to a precision you choose. Paste an SVG exported from Illustrator or Figma and a 12 KB file commonly drops well below 4 KB. Because SVG is vector math, this is lossless: the image still scales perfectly with no quality loss.',
    features: [
      'Strips comments and editor metadata (Illustrator/Inkscape junk) that browsers never need.',
      'Collapses redundant whitespace between elements and attributes.',
      'Rounds path coordinates to a chosen precision (e.g. 2 decimals) to trim long numbers.',
      'Shows before/after byte size and the exact percentage saved.',
      'Lossless — SVG is vector, so optimizing does not degrade the image; runs in your browser.',
    ],
    steps: [
      {
        title: 'Paste your SVG code',
        body: 'Paste the full markup, starting with <svg xmlns="http://www.w3.org/2000/svg" ...>. Open the .svg in a text editor and copy it, or copy from your design tool.',
      },
      {
        title: 'Adjust the options',
        body: 'Toggle remove comments, remove metadata and collapse whitespace, and set the decimal precision — 2 is a safe default that keeps curves smooth while trimming numbers like 12.4839271 to 12.48.',
      },
      {
        title: 'Check the savings and copy',
        body: 'The before/after panel shows, e.g., 12.40 KB → 3.80 KB (−69.4%). Copy the optimized SVG or download optimized.svg.',
      },
    ],
    faqs: [
      {
        q: 'Will optimizing reduce the image quality?',
        a: 'No. SVG is vector, so the shapes are described by math, not pixels. Removing metadata and whitespace changes nothing visible, and at a sensible precision (2+ decimals) the curves are indistinguishable from the original.',
      },
      {
        q: 'Can I lower the precision too far?',
        a: 'Yes — if you round to 0 decimals, complex paths can visibly distort. 1–2 decimals is usually safe; preview the result and bump precision up if you see jagged edges.',
      },
      {
        q: 'Does it remove things my SVG actually needs?',
        a: 'It only removes comments, editor metadata and whitespace by default — never paths, IDs or styles. If your CSS or JS targets the SVG by ID, those IDs are preserved.',
      },
    ],
  },

  'json-diff': {
    metaTitle: 'JSON Diff — Compare Two JSON Objects Structurally',
    metaDescription:
      'Compare two JSON objects and see exactly what was added, removed or changed, by path. Spot that user.age changed from 30 to 31 or items[2] was removed. Free, no signup.',
    intro:
      'This JSON diff compares two JSON documents structurally — not line by line — and lists every difference by its path. It tells you that user.profile.name changed, settings.darkMode was added, or items[2] was removed, regardless of key order or formatting. Each change shows the old and new value, so a deep nested edit like user.age: 30 → 31 is easy to spot.',
    features: [
      'Structural comparison: key order and whitespace differences are ignored, only real changes show.',
      'Each difference is labelled added, removed or changed with its full path (e.g. user.profile.name).',
      'Changed entries show both the old value and the new value side by side.',
      'Array elements are addressed by index, e.g. items[0], so reorderings are visible.',
      'Runs entirely in your browser — paste both objects and compare instantly.',
    ],
    steps: [
      {
        title: 'Paste the original JSON',
        body: 'Put your baseline object in the left box — for example {"user":{"name":"Ada","age":30}}.',
      },
      {
        title: 'Paste the JSON to compare',
        body: 'Put the updated object on the right — e.g. {"user":{"name":"Ada","age":31}}. Order of keys does not matter.',
      },
      {
        title: 'Read the differences',
        body: 'The diff lists each change by path: user.age changed 30 → 31. Added and removed keys are flagged separately so nothing is missed.',
      },
    ],
    faqs: [
      {
        q: 'Is this a line-by-line text diff?',
        a: 'No. It parses both sides as JSON and compares the structure, so reformatting or reordering keys produces zero differences. Only actual value, key and array changes are reported.',
      },
      {
        q: 'How are array changes shown?',
        a: 'Arrays are compared by index — items[2] removed, items[3] changed. Because it is index-based, inserting an element near the start can show several entries as changed; that reflects the real shift in positions.',
      },
      {
        q: 'What happens if one side is invalid JSON?',
        a: 'You will get a parse error pointing at the malformed side. Fix the syntax (a trailing comma or unquoted key is the usual culprit) and the comparison runs.',
      },
    ],
  },

  'cubic-bezier': {
    metaTitle: 'Cubic Bezier Generator — CSS Easing Curve Editor',
    metaDescription:
      'Drag the handles to design a CSS cubic-bezier() easing curve and copy the value. ease-in-out is (0.42, 0, 0.58, 1); preview the motion live. Free, no signup.',
    intro:
      'This cubic-bezier editor lets you design a CSS easing curve by dragging two control handles and copy the exact cubic-bezier() value. Start from presets like ease-in-out, which is cubic-bezier(0.42, 0, 0.58, 1), or pull a handle past the top edge for a springy overshoot. A live animation plays the curve so you can feel the timing before pasting it into transition or animation.',
    features: [
      'Drag two handles on the curve to shape the easing; the cubic-bezier() value updates live.',
      'Built-in presets: ease, linear, ease-in (0.42,0,1,1), ease-out (0,0,0.58,1), ease-in-out (0.42,0,0.58,1).',
      'Handles can go above 1 or below 0 for overshoot/anticipation (bounce-like) curves.',
      'A replayable animation previews the real motion the curve produces.',
      'Copy the ready-to-paste cubic-bezier(...) value with one click; runs in your browser.',
    ],
    steps: [
      {
        title: 'Start from a preset or drag the handles',
        body: 'Pick a preset such as ease-in-out, or drag the two control points. The X axis (0–1) is time and the Y axis is progress; pulling Y above 1 creates an overshoot.',
      },
      {
        title: 'Preview the motion',
        body: 'Watch the playback animation to judge the feel. Replay it after each tweak — a curve like (0.68, -0.55, 0.27, 1.55) gives a back-and-forth bounce.',
      },
      {
        title: 'Copy the value',
        body: 'Click Copy to grab the value, e.g. cubic-bezier(0.42, 0, 0.58, 1), and paste it into transition: all 0.3s cubic-bezier(...).',
      },
    ],
    faqs: [
      {
        q: 'What are the cubic-bezier values for the built-in CSS keywords?',
        a: 'ease = (0.25, 0.1, 0.25, 1), linear = (0, 0, 1, 1), ease-in = (0.42, 0, 1, 1), ease-out = (0, 0, 0.58, 1), and ease-in-out = (0.42, 0, 0.58, 1). This editor seeds those as presets.',
      },
      {
        q: 'Why can the Y values go above 1 or below 0?',
        a: 'The X values (control point times) are clamped to 0–1 by the CSS spec, but Y is unbounded. Values outside 0–1 make the animation overshoot or anticipate — the basis for bounce and elastic effects.',
      },
      {
        q: 'How do I use the value in CSS?',
        a: 'Drop it into a transition or animation timing function: transition: transform 0.3s cubic-bezier(0.42, 0, 0.58, 1); or animation-timing-function: cubic-bezier(...).',
      },
    ],
  },

  'mock-data': {
    metaTitle: 'Mock Data Generator — Fake JSON & CSV Test Data',
    metaDescription:
      'Generate dummy rows with names, emails, phones, addresses, dates, UUIDs and numbers as JSON or CSV. Make 100 fake users in one click. Free, no signup.',
    intro:
      'This mock data generator builds rows of realistic-looking dummy data for testing and demos. Pick the fields you want — name, email, phone, address, date, UUID, number — choose how many rows (up to 1000), and export as JSON or CSV. Generate 50 fake users with name, email and phone in one click to seed a database or fill out a UI mock-up.',
    features: [
      'Field types: name, email, phone, address, date, UUID and number — mix and match.',
      'Generate up to 1000 rows at once; duplicate field types get auto-numbered keys (email, email2).',
      'Export as pretty-printed JSON or as CSV for spreadsheets and bulk import.',
      'Re-generate to get a fresh random set whenever you need different sample values.',
      'Runs entirely in your browser — the fake data never touches a server.',
    ],
    steps: [
      {
        title: 'Choose your fields',
        body: 'Tick the columns you need — for example name, email and phone. Add UUID if you want a unique id per row.',
      },
      {
        title: 'Set the row count and format',
        body: 'Enter how many rows to make (e.g. 100, max 1000) and pick JSON or CSV output.',
      },
      {
        title: 'Generate, then copy or download',
        body: 'Click Generate to build the dataset, then copy the JSON or download the CSV to import into your tool or database.',
      },
    ],
    faqs: [
      {
        q: 'How many rows can I generate?',
        a: 'Up to 1000 rows per run. If you need more, generate several batches — everything runs locally so there is no rate limit.',
      },
      {
        q: 'Is the fake data realistic enough to test with?',
        a: 'Yes. Emails, phones, names and addresses follow plausible formats, and UUIDs are valid v4 IDs — good for filling tables, testing layouts and demoing UIs. It is random sample data, not real people.',
      },
      {
        q: 'JSON or CSV — which should I pick?',
        a: 'Use JSON to seed APIs, databases or frontend mocks, and CSV to open in Excel/Sheets or bulk-import. The same fields are produced either way.',
      },
    ],
  },

  'json-xml': {
    metaTitle: 'JSON to XML Converter — JSON ↔ XML Online',
    metaDescription:
      'Convert JSON to XML and XML back to JSON, both directions. Turn {"book":{"title":"..."}} into <root><book>...</book></root> with a custom root name. Free, no signup.',
    intro:
      'This converter translates between JSON and XML in both directions. Going JSON → XML, an object like {"book":{"title":"Moby Dick","year":1851}} becomes nested <book><title>Moby Dick</title><year>1851</year></book> wrapped in a root element you can name. Going XML → JSON, it parses the tags back into a JSON object. Pretty-printing is on by default for readable output.',
    features: [
      'Two-way conversion: JSON → XML and XML → JSON.',
      'Custom root element name (defaults to "root") so the XML wrapper matches your schema.',
      'Pretty-print toggle for indented, readable output — or compact on one line.',
      'Arrays become repeated elements; nested objects become nested tags.',
      'Copy or download the result; everything runs in your browser.',
    ],
    steps: [
      {
        title: 'Pick a direction',
        body: 'Choose JSON → XML or XML → JSON depending on what you are pasting.',
      },
      {
        title: 'Paste your input',
        body: 'For JSON → XML, paste an object like {"book":{"title":"Moby Dick","year":1851}} and set the root name (e.g. root or catalog).',
      },
      {
        title: 'Convert and copy',
        body: 'Click Convert. The output appears formatted — e.g. <root><book><title>Moby Dick</title></book></root>. Copy it or download the file.',
      },
    ],
    faqs: [
      {
        q: 'How are JSON arrays represented in XML?',
        a: 'Each array item becomes a repeated child element. So {"tags":["a","b"]} produces <tags>a</tags><tags>b</tags> — the standard way to express a list in XML.',
      },
      {
        q: 'Why do I need a root element name?',
        a: 'XML requires exactly one top-level element, while JSON can start with an object directly. The root name (default "root") wraps everything so the output is valid XML.',
      },
      {
        q: 'Is the round-trip lossless?',
        a: 'Mostly. JSON → XML → JSON preserves structure and values, but XML has no native distinction between a number and a string, so types may come back as strings. Attributes and JSON-only types like null can also differ.',
      },
    ],
  },

  'bmi-calc': {
    metaTitle: 'BMI Calculator — Body Mass Index (Metric & Imperial)',
    metaDescription:
      'Calculate your BMI from height and weight in metric or imperial units and see your WHO category. 170 cm / 65 kg = 22.5 (normal 18.5–24.9). Free, no signup.',
    intro:
      'This BMI calculator works out your Body Mass Index from height and weight, in metric (cm/kg) or imperial (in/lb), and places you on the WHO scale. For example 170 cm and 65 kg gives a BMI of 22.5 — within the normal range of 18.5–24.9. A coloured bar shows where you sit across underweight, normal, overweight and obese.',
    features: [
      'Metric (cm / kg) and imperial (in / lb) input with automatic conversion.',
      'WHO categories: underweight (<18.5), normal (18.5–24.9), overweight (25–29.9), obese (≥30).',
      'A visual bar marks your exact BMI across the 15–40 range.',
      'Instant recalculation as you adjust height or weight.',
      'Runs entirely in your browser — your measurements are never uploaded.',
    ],
    steps: [
      {
        title: 'Choose your units',
        body: 'Pick metric (cm and kg) or imperial (inches and pounds).',
      },
      {
        title: 'Enter height and weight',
        body: 'Type your numbers — for example height 170 and weight 65 in metric.',
      },
      {
        title: 'Read your BMI and category',
        body: 'The result shows instantly: 170 cm / 65 kg = 22.5, in the normal range. The coloured bar shows how close you are to the next band.',
      },
    ],
    faqs: [
      {
        q: 'What is a normal BMI range?',
        a: 'By the WHO scale: under 18.5 is underweight, 18.5–24.9 is normal, 25–29.9 is overweight, and 30 or above is obese. A BMI of 22.5 sits comfortably in the normal range.',
      },
      {
        q: 'How is BMI calculated?',
        a: 'BMI = weight in kilograms divided by height in metres squared. For 65 kg at 1.70 m: 65 ÷ (1.70 × 1.70) = 22.5. Imperial inputs are converted to metric first.',
      },
      {
        q: 'Is BMI accurate for everyone?',
        a: 'It is a quick screening number, not a diagnosis. It does not distinguish muscle from fat, so very muscular people can read high while the measure still works well for the general population. Consult a clinician for personal advice.',
      },
    ],
  },

  'loan-calc': {
    metaTitle: 'Loan Calculator — Monthly Payment & Total Interest',
    metaDescription:
      'Calculate the monthly payment, total interest and total cost of a loan. A 30M at 5% over 5 years is about 566K/month. Free amortization calculator, no signup.',
    intro:
      'This loan calculator works out your fixed monthly payment using the equal-payment (amortizing) method, then shows the total you will pay and how much of that is interest. Enter a principal of 30,000,000 at 5% annual interest over 5 years and it returns roughly 566,000 per month, with the total interest broken out. Change the term in years or months to compare scenarios.',
    features: [
      'Equal-payment (amortizing) method: the same fixed amount every month.',
      'Returns monthly payment, total amount repaid and total interest paid.',
      'Term entered in years or months; annual interest rate as a percent.',
      'Handles a 0% rate as a simple principal split across the months.',
      'Runs entirely in your browser — your figures are never uploaded.',
    ],
    steps: [
      {
        title: 'Enter the loan amount',
        body: 'Type the principal you are borrowing — for example 30,000,000.',
      },
      {
        title: 'Enter the rate and term',
        body: 'Add the annual interest rate (e.g. 5) and the term, choosing years or months — e.g. 5 years.',
      },
      {
        title: 'Read the breakdown',
        body: 'The result shows the monthly payment (about 566,000 for this example), total repaid and total interest. Adjust any field to compare.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between equal-payment and equal-principal?',
        a: 'Equal-payment (used here) keeps every monthly payment the same — early payments are mostly interest, later ones mostly principal. Equal-principal repays a fixed slice of principal each month, so payments start higher and shrink over time, and you pay slightly less total interest.',
      },
      {
        q: 'How is the monthly payment calculated?',
        a: 'With the amortization formula: payment = P × r ÷ (1 − (1 + r)^−n), where P is the principal, r is the monthly rate (annual ÷ 12 ÷ 100) and n is the number of months. At 0% it is simply principal ÷ months.',
      },
      {
        q: 'Does this include fees, taxes or insurance?',
        a: 'No. It calculates principal and interest only. Real-world loans may add origination fees, insurance or taxes, so check your lender’s figures for the full cost.',
      },
    ],
  },

  'discount': {
    metaTitle: 'Discount Calculator — Sale Price & Percent Off',
    metaDescription:
      'Calculate a discounted price or find the percent off. 20% off 30,000 = 24,000 (save 6,000); or 30,000 → 24,000 = 20% off. Free, no signup.',
    intro:
      'This discount calculator works both ways. Forward: enter a price and a percent off to get the sale price and the amount saved — 20% off 30,000 gives 24,000, saving 6,000. Reverse: enter the original and the sale price to find the discount percentage — 30,000 down to 24,000 is 20% off. Handy for shopping, repricing and checking deals.',
    features: [
      'Forward mode: price + percent off → sale price and amount saved.',
      'Reverse mode: original price + sale price → the discount percentage.',
      'Shows both the final price and the money saved, not just one number.',
      'Validates inputs (e.g. rejects discounts over 100% or a sale price above the original).',
      'Runs entirely in your browser; copy the result with one tap.',
    ],
    steps: [
      {
        title: 'Pick a mode',
        body: 'Choose forward (you know the percent off) or reverse (you know the sale price and want the percentage).',
      },
      {
        title: 'Enter the numbers',
        body: 'Forward: enter 30,000 and 20%. Reverse: enter original 30,000 and sale 24,000.',
      },
      {
        title: 'Read the result',
        body: 'Forward shows sale price 24,000 and savings 6,000. Reverse shows 20% off. Copy it if you need to share or note it.',
      },
    ],
    faqs: [
      {
        q: 'How do I calculate a percentage discount?',
        a: 'Multiply the price by the percent as a decimal to get the saving, then subtract. For 20% off 30,000: 30,000 × 0.20 = 6,000 saved, so the sale price is 24,000.',
      },
      {
        q: 'How do I find what percent off two prices represent?',
        a: 'Use reverse mode: (original − sale) ÷ original × 100. From 30,000 to 24,000 that is 6,000 ÷ 30,000 × 100 = 20% off.',
      },
      {
        q: 'Does it handle tax?',
        a: 'No — it calculates the discount only. Apply or remove sales tax/VAT separately depending on whether your listed price already includes it.',
      },
    ],
  },

  'timezone': {
    metaTitle: 'Time Zone Converter — Convert Time Between Zones',
    metaDescription:
      'Convert a time from one time zone to another, e.g. 3 PM Asia/Seoul to America/New_York. Uses your browser’s IANA zone database with correct DST. Free, no signup.',
    intro:
      'This time zone converter takes a time in one zone and shows what it is in another, handling daylight saving time automatically. Convert 3:00 PM in Asia/Seoul and instantly see it as 2:00 AM in America/New_York, or compare your local time against London and Sydney. It uses the browser’s built-in IANA time zone database, so the offsets and DST rules are always current.',
    features: [
      'Convert any time between IANA zones like Asia/Seoul, Europe/London, America/New_York.',
      'Daylight saving time is applied automatically from the browser’s zone data.',
      'Defaults to your detected local time zone as a starting point.',
      'Searchable list of every time zone your browser supports.',
      'Runs entirely in your browser — no server lookups for the conversion.',
    ],
    steps: [
      {
        title: 'Set the source time and zone',
        body: 'Enter the time and choose the from zone — for example 3:00 PM in Asia/Seoul.',
      },
      {
        title: 'Pick the target zone',
        body: 'Choose the zone to convert to, such as America/New_York or Europe/London.',
      },
      {
        title: 'Read the converted time',
        body: 'The result shows the equivalent moment in the target zone — 3 PM Seoul becomes 2 AM New York — with DST already accounted for.',
      },
    ],
    faqs: [
      {
        q: 'Does it handle daylight saving time?',
        a: 'Yes. It uses the IANA time zone database built into your browser, which knows each zone’s DST rules and switch dates, so converted times stay correct across spring/fall transitions.',
      },
      {
        q: 'Why use IANA zone names like Asia/Seoul instead of GMT+9?',
        a: 'A fixed offset like GMT+9 cannot express daylight saving, which changes the offset part of the year. Named zones (Asia/Seoul, America/New_York) carry the full rules so the conversion is correct year-round.',
      },
      {
        q: 'What if my time zone is not listed?',
        a: 'The list comes from your browser’s supported zones, which covers all standard IANA names. On older browsers a built-in fallback list of major cities is used instead.',
      },
    ],
  },

  'date-diff': {
    metaTitle: 'Date Difference Calculator — Days Between Dates & D-Day',
    metaDescription:
      'Count the days between two dates or add days to find a D-day. From 2026-01-01 to 2026-04-11 is 100 days; +100 days from today gives your D-100. Free, no signup.',
    intro:
      'This date calculator has two modes. Difference counts the time between two dates as a total number of days plus a years/months/days breakdown — 2026-01-01 to 2026-04-11 is 100 days. Add takes a base date and a number of days to find a target date, perfect for working out a D-100 or a deadline 90 days out. Calculations use UTC midnight so time zones never shift the count.',
    features: [
      'Difference mode: total days plus an exact years / months / days breakdown.',
      'Add mode: base date ± N days → the resulting date with its weekday.',
      'Validates real calendar dates (rejects impossible ones like 2026-02-30).',
      'Leap years and varying month lengths are handled correctly.',
      'Runs entirely in your browser; copy any result with one tap.',
    ],
    steps: [
      {
        title: 'Choose Difference or Add',
        body: 'Pick Difference to count days between two dates, or Add to project a date forward or backward.',
      },
      {
        title: 'Enter the dates',
        body: 'Difference: enter a start (e.g. 2026-01-01) and end (2026-04-11). Add: enter a base date and a day count like 100.',
      },
      {
        title: 'Read the answer',
        body: 'Difference shows 100 days (and 0 years, 3 months, 10 days). Add shows the target date — for a D-100 countdown, add 100 days to today.',
      },
    ],
    faqs: [
      {
        q: 'How do I calculate a D-day or D-100?',
        a: 'Use Add mode: pick your base date and add the number of days. Adding 100 days to today gives the date that is your D-100. To count down to a known event, use Difference mode between today and that date.',
      },
      {
        q: 'Are the start and end dates both counted?',
        a: 'The difference is the number of full days between the two dates. From 2026-01-01 to 2026-04-11 that is 100 days. If you need an inclusive count (counting both endpoints), add one.',
      },
      {
        q: 'Do time zones affect the result?',
        a: 'No. Dates are parsed at UTC midnight, so the day count is the same no matter where you are. That avoids off-by-one errors caused by local time offsets.',
      },
    ],
  },

  'aspect-ratio': {
    metaTitle: 'Aspect Ratio Calculator — 16:9, 4:3 Dimensions',
    metaDescription:
      'Calculate the missing width or height for an aspect ratio. At 16:9, a 1920px width gives 1080px height; type a height to get the width. Free, no signup.',
    intro:
      'This aspect ratio calculator finds the missing dimension for a given ratio. Set 16:9 and a width of 1920px, and it returns a height of 1080px; type a height instead and it gives you the matching width. Use the presets (16:9, 4:3, 21:9, 1:1, 3:2, 9:16) or enter any custom ratio for resizing video, images and layouts without distortion.',
    features: [
      'Enter either width or height — the other side is calculated to keep the ratio.',
      'Presets for 16:9, 4:3, 21:9, 1:1, 3:2 and 9:16, plus any custom ratio.',
      'Keeps proportions exact so images and video never stretch or squash.',
      'Decimal results are rounded cleanly (e.g. 1080, not 1080.00).',
      'Runs entirely in your browser — copy the dimensions in one tap.',
    ],
    steps: [
      {
        title: 'Set the ratio',
        body: 'Pick a preset like 16:9, or type a custom ratio such as 21:9 into the two ratio fields.',
      },
      {
        title: 'Enter one dimension',
        body: 'Type a width (e.g. 1920) and leave height blank, or do the reverse — the field you fill becomes the source.',
      },
      {
        title: 'Read the matching dimension',
        body: 'At 16:9, a 1920px width gives 1080px height. Change the ratio or value and the other side recalculates instantly.',
      },
    ],
    faqs: [
      {
        q: 'What height is 16:9 at 1920px wide?',
        a: 'It is 1080px. The math is width × (ratio height ÷ ratio width) = 1920 × (9 ÷ 16) = 1080. That is why 1920×1080 is called Full HD or "16:9".',
      },
      {
        q: 'How do I keep an image from stretching when resizing?',
        a: 'Resize both sides by the same ratio. Enter your target width here at the original ratio to get the correct height (or vice versa), then use those exact dimensions.',
      },
      {
        q: 'Can I use a custom ratio like 2.39:1?',
        a: 'Yes. Type the two numbers into the ratio fields — for example 2.39 and 1 — and the calculator will work out dimensions for that cinematic ratio just like the presets.',
      },
    ],
  },

  'password-strength': {
    metaTitle: 'Password Strength Checker — Entropy & Crack Time',
    metaDescription:
      'Check password strength by entropy in bits and estimated crack time. A 12-char mixed password reaches ~78 bits. Tested locally — nothing is sent anywhere. Free, no signup.',
    intro:
      'This password strength checker estimates how hard a password is to guess by calculating its entropy in bits and an approximate crack time. It counts the character types you use — lowercase, uppercase, digits, symbols — to size the search space, then scores it from weak to very strong. A 12-character password mixing all four types reaches around 78 bits, well into strong territory. Your password is analysed entirely in your browser and never sent anywhere.',
    features: [
      'Entropy in bits = length × log2(character-set size), the standard strength measure.',
      'Detects which character classes you use: lowercase (26), uppercase (26), digits (10), symbols (~33).',
      'Estimates crack time against a fast offline attacker (~10 billion guesses/second).',
      'Four-level rating (weak / medium / strong / very strong) with a coloured bar.',
      'Analysed locally in your browser — the password is never transmitted.',
    ],
    steps: [
      {
        title: 'Type or paste a password',
        body: 'Enter the password to test — for example a passphrase or a 12-character mix like Tr0ub4dor&3.',
      },
      {
        title: 'Read the entropy and rating',
        body: 'See the bits of entropy and the level. Under 40 bits is weak; around 60 is medium; 78+ with mixed characters lands in strong/very strong.',
      },
      {
        title: 'Strengthen if needed',
        body: 'Add length and more character types to raise entropy. A few extra random characters help far more than swapping a letter for a lookalike symbol.',
      },
    ],
    faqs: [
      {
        q: 'What is password entropy?',
        a: 'Entropy is a measure, in bits, of how unpredictable a password is. It is length × log2(size of the character set). Each extra bit doubles the number of guesses needed, so 60 bits is twice as hard as 59. Aim for 70+ bits for important accounts.',
      },
      {
        q: 'How many bits is "strong"?',
        a: 'As a rough guide: under 40 bits is weak, 40–60 medium, 60–80 strong, and 80+ very strong. A 12-character password using upper, lower, digits and symbols reaches roughly 78 bits.',
      },
      {
        q: 'Does length or complexity matter more?',
        a: 'Length usually wins. Adding characters multiplies the search space exponentially, while adding one new character type only widens the base. A long random passphrase beats a short password full of symbols.',
      },
    ],
  },

  'rsa-keypair': {
    metaTitle: 'RSA Key Pair Generator — 2048/4096-bit PEM Keys',
    metaDescription:
      'Generate an RSA public/private key pair (2048, 3072 or 4096-bit) for signing or encryption, as PEM. Created in your browser with WebCrypto. Free, no signup.',
    intro:
      'This tool generates an RSA public/private key pair right in your browser using the WebCrypto API, and exports both as PEM text. Choose 2048, 3072 or 4096 bits and whether the keys are for signing (RSA-PSS) or encryption (RSA-OAEP). The keys are created locally and never leave the page — but treat the private key like a password: copy it somewhere safe and never share it.',
    features: [
      'Key sizes: 2048, 3072 and 4096 bits (longer = stronger but slower).',
      'Usage modes: signing (RSA-PSS) or encryption (RSA-OAEP), both with SHA-256.',
      'Exports standard PEM — SPKI for the public key, PKCS#8 for the private key.',
      'Generated with the browser’s WebCrypto, not a JS reimplementation.',
      'Runs entirely in your browser; copy or download each key — keep the private key secret.',
    ],
    steps: [
      {
        title: 'Choose key size and usage',
        body: 'Pick a size — 2048 for general use, 4096 for higher security — and select signing or encryption.',
      },
      {
        title: 'Generate the pair',
        body: 'Click Generate. WebCrypto creates the pair locally; 4096-bit can take a few seconds.',
      },
      {
        title: 'Save your keys safely',
        body: 'Copy or download both PEM files. Share the public key freely; store the private key securely and never commit it to a repo or send it to anyone.',
      },
    ],
    faqs: [
      {
        q: 'Should I use 2048 or 4096 bits?',
        a: '2048-bit is the current baseline and fine for most uses; 4096-bit offers a larger security margin for long-lived or high-value keys, at the cost of slower generation and operations. 3072-bit is a middle ground. For new keys, 2048 or 3072 is a reasonable default.',
      },
      {
        q: 'Is it safe to generate keys in a browser?',
        a: 'The keys are created with WebCrypto entirely on your device and are never uploaded. That said, generate them on a machine you trust, and immediately move the private key to secure storage — anyone with the private key can impersonate or decrypt for you.',
      },
      {
        q: 'What is the difference between the signing and encryption modes?',
        a: 'Signing uses RSA-PSS (you sign data with the private key; others verify with the public key). Encryption uses RSA-OAEP (others encrypt to your public key; you decrypt with the private key). Pick the one that matches your use case, or generate a separate pair for each.',
      },
    ],
  },

  'barcode': {
    metaTitle: 'Barcode Generator — EAN, UPC, Code 128 (SVG/PNG)',
    metaDescription:
      'Generate barcodes in Code 128, Code 39, EAN-13, EAN-8, UPC and more. EAN-13 needs 13 digits; download as SVG or PNG. Free barcode maker, no signup.',
    intro:
      'This barcode generator creates 1D barcodes in common retail and logistics formats — Code 128, Code 39, EAN-13, EAN-8, UPC, ITF-14 and others — and downloads them as crisp SVG or PNG. Type your data, pick a format (EAN-13 expects exactly 13 digits, UPC 12), and adjust the bar width, height and colours. Great for product labels, inventory tags and shipping codes.',
    features: [
      'Formats: Code 128, Code 39, EAN-13, EAN-8, UPC, ITF-14, MSI, pharmacode and codabar.',
      'Validates digit counts per format (EAN-13 = 13, EAN-8 = 8, UPC = 12, ITF-14 = 14).',
      'Customise bar width, height, font size, and foreground/background colours.',
      'Download as scalable SVG (best for print) or rasterised PNG.',
      'Runs entirely in your browser — your codes are never uploaded.',
    ],
    steps: [
      {
        title: 'Enter the data',
        body: 'Type the value to encode — for a product barcode, e.g. 12 digits for UPC or 13 for EAN-13.',
      },
      {
        title: 'Pick the format and style',
        body: 'Choose a format like Code 128 (handles text and numbers) or EAN-13, then tweak height, bar width and colours.',
      },
      {
        title: 'Download SVG or PNG',
        body: 'The barcode renders live. Download SVG for sharp printing at any size, or PNG for quick placement in documents.',
      },
    ],
    faqs: [
      {
        q: 'Which barcode format should I use?',
        a: 'Use EAN-13 or UPC for retail products (they need a valid 13- or 12-digit number), Code 128 for general text/numeric data like internal SKUs, Code 39 for simple alphanumerics, and ITF-14 for shipping cartons.',
      },
      {
        q: 'Why does my EAN-13 or UPC show an error?',
        a: 'Those formats require a specific digit count — EAN-13 needs exactly 13 digits, UPC 12, EAN-8 8, ITF-14 14 — and only digits. If you enter the wrong length or non-numeric characters, the format rejects it. Switch to Code 128 if you need to encode free text.',
      },
      {
        q: 'Can this make QR codes?',
        a: 'No — these are 1D (linear) barcodes. For 2D QR codes use a dedicated QR generator; this tool focuses on retail and logistics barcode symbologies.',
      },
    ],
  },

  'image-color-picker': {
    metaTitle: 'Image Color Picker — Get HEX & RGB From a Photo',
    metaDescription:
      'Upload an image and click any pixel to grab its exact HEX and RGB color, e.g. #3A7BD5 / rgb(58,123,213). Keeps a recent-colors list. Free, no signup.',
    intro:
      'This image color picker lets you pull the exact color of any pixel from a photo or screenshot. Upload an image, click a spot, and it reads that pixel’s value as HEX and RGB — for example #3A7BD5 / rgb(58, 123, 213). Every color you pick is saved to a recent list (up to 12) so you can build a quick palette from a reference image.',
    features: [
      'Click any pixel to read its exact color as HEX and RGB.',
      'Reads from the image at full resolution for pixel-accurate values.',
      'Keeps a recent-colors list (up to 12) to assemble a palette.',
      'Copy any HEX or RGB value with one tap.',
      'Runs entirely in your browser — the image is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload an image',
        body: 'Drop in a photo, screenshot or design — any common image format works (PNG, JPG, WebP).',
      },
      {
        title: 'Click a pixel',
        body: 'Click the exact spot whose color you want. The picked color shows as HEX (e.g. #3A7BD5) and RGB (58, 123, 213).',
      },
      {
        title: 'Copy or collect colors',
        body: 'Copy the value you need, or keep clicking to fill the recent-colors list and build a palette from the image.',
      },
    ],
    faqs: [
      {
        q: 'Does it give HEX and RGB?',
        a: 'Yes. Each pick shows both the HEX code (e.g. #3A7BD5) and the RGB triplet (58, 123, 213), so you can paste whichever your CSS or design tool expects.',
      },
      {
        q: 'Is the color exact or averaged?',
        a: 'It reads the single pixel you click at the image’s native resolution — no averaging or smoothing. For a flat area any pixel works; for gradients, click precisely where you want the sample.',
      },
      {
        q: 'Can I pick several colors to make a palette?',
        a: 'Yes. Each click is added to the recent-colors list (up to 12), so you can sample the key tones of an image and copy them out as a palette.',
      },
    ],
  },

  'avatar-crop': {
    metaTitle: 'Circular Avatar Crop — Round Profile Picture Maker',
    metaDescription:
      'Crop any photo into a circular avatar with a transparent background. Center-crops to a square and exports a round 256px (or up to 1024px) PNG. Free, no signup.',
    intro:
      'This tool turns any photo into a round profile picture. It center-crops your image to a square, masks it into a circle, and exports a transparent PNG ready for forums, chat apps and social profiles. Choose an output size — 128, 256, 512 or 1024 px — and download a clean circular avatar with no square corners.',
    features: [
      'Center-crops to a square automatically, then masks into a perfect circle.',
      'Transparent PNG output — the corners are see-through, not white.',
      'Output sizes: 128, 256, 512 and 1024 px to suit any profile.',
      'Live preview so you see the round result before downloading.',
      'Runs entirely in your browser — your photo is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload your photo',
        body: 'Drop in any image — a portrait or square photo works best since it crops from the center.',
      },
      {
        title: 'Pick an output size',
        body: 'Choose the size you need — 256px is a common avatar size; pick 512 or 1024 for high-DPI displays.',
      },
      {
        title: 'Download the round PNG',
        body: 'Check the circular preview and download the transparent PNG, named like photo-avatar-256.png.',
      },
    ],
    faqs: [
      {
        q: 'Why is the output a PNG?',
        a: 'A circular crop needs transparent corners, and only PNG (or WebP) supports transparency. A JPG would fill the corners with a solid colour, breaking the round shape against coloured backgrounds.',
      },
      {
        q: 'Can I choose which part of the photo is shown?',
        a: 'The crop is taken from the center of the image at the largest square that fits. To feature a specific area, crop or position your photo so the subject is centered before uploading.',
      },
      {
        q: 'What size should my avatar be?',
        a: '256px suits most sites, but pick 512 or 1024px for retina/high-DPI screens so it stays sharp. The image is downscaled, so starting from a larger source photo gives the best quality.',
      },
    ],
  },

  'word-frequency': {
    metaTitle: 'Word Frequency Counter — Count Word Occurrences',
    metaDescription:
      'Paste text and rank how often each word appears, with optional stopword removal and a min-length filter. See the top 20 words and export CSV. Free, no signup.',
    intro:
      'This word frequency counter analyses any text and ranks every word by how often it appears. Paste an article or transcript and instantly see the most common words — useful for keyword research, content analysis and writing checks. Options let you ignore case, set a minimum word length, and drop common stopwords (English and Korean) so meaningful terms rise to the top.',
    features: [
      'Ranks every word by count, with the top N (e.g. 20) shown by default.',
      'Optional stopword removal for English and Korean (the, and, 그리고, 등…).',
      'Ignore-case toggle and a minimum word-length filter to cut noise.',
      'Handles mixed-language text and Unicode words correctly.',
      'Export the full ranking as CSV; runs entirely in your browser.',
    ],
    steps: [
      {
        title: 'Paste your text',
        body: 'Drop in the article, transcript or document you want to analyse.',
      },
      {
        title: 'Tune the filters',
        body: 'Toggle ignore-case, set a minimum length (e.g. 3 to skip "a"/"it"), and enable stopword removal to hide filler words.',
      },
      {
        title: 'Read the ranking or export',
        body: 'See the top words with their counts. Adjust the top-N value, or export the whole list as a word,count CSV.',
      },
    ],
    faqs: [
      {
        q: 'What are stopwords and should I remove them?',
        a: 'Stopwords are extremely common words (the, and, of, 그리고, 등) that carry little meaning. Removing them is useful for keyword analysis so content-bearing terms surface. Leave them in if you are doing literal counting.',
      },
      {
        q: 'Is the count case-sensitive?',
        a: 'By default it is case-insensitive, so "Apple" and "apple" are counted together. Turn off ignore-case if you need to distinguish them — handy for code identifiers or proper nouns.',
      },
      {
        q: 'Can I analyse Korean or mixed-language text?',
        a: 'Yes. Words are matched by Unicode letters and numbers, so Korean, English and mixed text all work, and the stopword list covers both English and Korean filler words.',
      },
    ],
  },

  'md-html': {
    metaTitle: 'Markdown to HTML Converter — Markdown ↔ HTML',
    metaDescription:
      'Convert Markdown to HTML and HTML back to Markdown, with a live preview. # Hello becomes <h1>Hello</h1>; GFM tables and fenced code are supported. Free, no signup.',
    intro:
      'This converter turns Markdown into HTML and HTML back into Markdown, with a live rendered preview. Markdown like # Hello and **bold** becomes <h1>Hello</h1> and <strong>bold</strong>; paste HTML the other way and it is converted back to clean Markdown. GitHub Flavored Markdown — tables, fenced code blocks, task lists — is supported, so READMEs and docs convert faithfully.',
    features: [
      'Two-way conversion: Markdown → HTML and HTML → Markdown.',
      'GitHub Flavored Markdown (GFM): tables, fenced code blocks and more.',
      'Live preview of the rendered HTML, sanitised for safe display.',
      'Copy the output or download it as a file.',
      'Runs entirely in your browser — your content is never uploaded.',
    ],
    steps: [
      {
        title: 'Choose a direction',
        body: 'Pick Markdown → HTML or HTML → Markdown depending on what you have.',
      },
      {
        title: 'Paste your content',
        body: 'For Markdown → HTML, paste something like # Hello followed by **Bold** and a ```js code block.',
      },
      {
        title: 'Preview, then copy or download',
        body: 'Watch the live preview render, then copy the HTML (e.g. <h1>Hello</h1>) or download the result.',
      },
    ],
    faqs: [
      {
        q: 'Is GitHub Flavored Markdown (GFM) supported?',
        a: 'Yes. The converter handles GFM features like tables, fenced code blocks (```), and task lists, so Markdown written for GitHub or most docs sites converts correctly.',
      },
      {
        q: 'Is the HTML output safe to use?',
        a: 'The live preview is sanitised to block script injection, so pasting untrusted HTML won’t run code in the preview. The copyable output is the raw conversion result — review it before embedding HTML from sources you don’t control.',
      },
      {
        q: 'How good is HTML → Markdown conversion?',
        a: 'It maps standard tags well — headings, lists, links, bold/italic, code and tables. Very complex or deeply nested HTML, inline styles and custom elements may not have a clean Markdown equivalent and can be simplified.',
      },
    ],
  },

  'pdf-to-txt': {
    metaTitle: 'PDF to Text — Extract Text From PDF to .txt',
    metaDescription:
      'Extract the text layer from a PDF and save it as a .txt file, with options to rejoin hyphenated words and mark page breaks. Note: scanned PDFs need OCR. Free, no signup.',
    intro:
      'This tool pulls the text out of a PDF and gives you a plain .txt file. It reads the PDF’s embedded text layer page by page, with options to rejoin words split across line breaks with a hyphen and to insert page-break markers. It works on PDFs created from real documents (Word exports, web pages, reports); scanned or image-only PDFs have no text layer, so those need OCR first.',
    features: [
      'Extracts the embedded text from every page into one .txt file.',
      'Optionally rejoins hyphenated words broken across line ends.',
      'Optional page-break markers so you can tell where each page ends.',
      'Shows progress and can be cancelled on large documents.',
      'Runs entirely in your browser — your PDF is never uploaded.',
    ],
    steps: [
      {
        title: 'Upload your PDF',
        body: 'Drop in a text-based PDF — for example a report or article exported from Word or a browser.',
      },
      {
        title: 'Set the options',
        body: 'Turn on join hyphenated words for cleaner paragraphs, and enable page breaks if you want to keep page boundaries.',
      },
      {
        title: 'Extract and download',
        body: 'Run the extraction (a progress bar shows large files), then copy the text or download the .txt file.',
      },
    ],
    faqs: [
      {
        q: 'Does it work on scanned PDFs?',
        a: 'No. A scanned PDF is just images of pages with no text layer, so there is nothing to extract — you will get an empty result. Run an OCR tool on it first to turn the images into selectable text, then extract.',
      },
      {
        q: 'Will it keep the original layout, tables and columns?',
        a: 'It extracts the readable text, not the visual layout. Reading order is generally preserved, but multi-column pages and tables may not line up exactly, since a .txt file has no concept of columns.',
      },
      {
        q: 'What does "join hyphenated words" do?',
        a: 'When a word is split across two lines with a hyphen (e.g. "inter-" then "national"), this option stitches it back into "international" so the text reads naturally instead of keeping the line-break hyphen.',
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
