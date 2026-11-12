# JSON Formatter & Validator

A WordPress plugin that adds a JSON formatter, validator and converter to any page with a shortcode. Everything runs in the visitor's browser: pasted text, uploaded files and fetched URLs never pass through the WordPress server.

It runs the [JSON formatter and validator on dhirenpatel.me](https://www.dhirenpatel.me/tools/online-json-formatter-validator/).

## What it does

- Load JSON by pasting it, choosing a `.json` file or fetching it from a URL.
- Format (2-space indent), validate or minify it. Pasted input is validated and formatted as you type.
- Integers too large for a JavaScript number (above 9007199254740991) keep every digit in every output.
- Quotes unquoted keys (`{a: 1}` becomes `{"a": 1}`) when that turns invalid input into valid JSON.
- Convert to XML, CSV or YAML.
- Copy the output or download it as a file.
- Messages go to a `role="status"` region, so screen readers announce them.

URL fetching happens in the browser, so it works only for full `https://` URLs that allow cross-origin requests (CORS).

## Install

1. Download this repository as a ZIP (Code → Download ZIP).
2. In WordPress, go to Plugins → Add New Plugin → Upload Plugin, choose the ZIP and activate it.
3. Add the shortcode to a page:

```
[json_tool]
```

The scripts and styles load only on pages that use the shortcode. No external scripts are loaded.

## Files

| File | Purpose |
|---|---|
| `json-formatter-validator.php` | Plugin header, shortcode and tool markup |
| `js/json-tool.js` | Formatting, validation, conversion, copy and download |
| `js/vendor/js-yaml.min.js` | js-yaml 4.1.0, used for the YAML conversion |
| `js/vendor/js-yaml-LICENSE.txt` | js-yaml's MIT licence |
| `css/json-tool.css` | Tool layout and styles |

## Licence

The plugin is GPL-2.0-or-later. See [LICENSE](LICENSE).

[js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 is bundled under the MIT licence, © Vitaly Puzrin. See [js/vendor/js-yaml-LICENSE.txt](js/vendor/js-yaml-LICENSE.txt).

## Author

[Dhiren Patel](https://www.dhirenpatel.me/), Principal Full-Stack Engineer.
