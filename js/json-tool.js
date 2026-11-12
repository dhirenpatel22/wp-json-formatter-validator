document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    const errorMsg = document.getElementById('error-message');
    const fileUpload = document.getElementById('file-upload');
    const urlInput = document.getElementById('url-input');
    const urlError = document.getElementById('url-error');
    // What the output box holds, so Download uses the right file name and type.
    const outputTypes = {
        json: { ext: 'json', mime: 'application/json' },
        xml: { ext: 'xml', mime: 'application/xml' },
        csv: { ext: 'csv', mime: 'text/csv' },
        yaml: { ext: 'yaml', mime: 'application/yaml' }
    };
    let outputType = 'json';
    // JSON.parse rounds integers beyond 2^53 (12345678901234567890 becomes 12345678901234567000).
    // parseJSON swaps them for strings that start with this marker, and every output writes the
    // original digits back. Empty when the last parsed input had no such integers.
    let bigMarker = '';

    // Auto-format and validate on input (skip error for blank)
    input.addEventListener('input', function() {
        if (input.value.trim() === '') {
            errorMsg.textContent = ''; // Clear error if blank
            clearOutput();
            return;
        }
        validateJSON(true, false); // Silent, and never rewrites what the user is typing
        formatJSON(false);
    });

    document.getElementById('format-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            inputFail('Input is empty');
            return;
        }
        if (formatJSON(true)) {
            showStatus('Formatted');
        }
    });

    document.getElementById('validate-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            inputFail('Input is empty');
            return;
        }
        if (!validateJSON(false)) {
            clearOutput();
        }
    });

    document.getElementById('minify-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            inputFail('Input is empty');
            return;
        }
        try {
            output.value = jsonText(parseJSON(input.value));
            outputType = 'json';
            showStatus('Minified');
        } catch (e) {
            inputFail('Invalid JSON: ' + e.message);
        }
    });

    document.getElementById('copy-btn').addEventListener('click', function() {
        if (output.value.trim() === '') {
            showError('Nothing to copy');
            return;
        }
        navigator.clipboard.writeText(output.value).then(
            () => showStatus('Copied to clipboard'),
            () => showError('Could not copy; select the output and copy it')
        );
    });

    document.getElementById('download-btn').addEventListener('click', function() {
        if (output.value.trim() === '') {
            showError('Nothing to download');
            return;
        }
        const kind = outputTypes[outputType];
        const name = (outputType === 'json' ? 'formatted' : 'converted') + '.' + kind.ext;
        const blob = new Blob([output.value], {type: kind.mime});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        showStatus('Downloaded ' + name);
    });

    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            return; // Picker cancelled.
        }
        const reader = new FileReader();
        reader.onload = function(event) { input.value = event.target.result; validateJSON(true, false); formatJSON(false); };
        reader.readAsText(file);
    });

    document.getElementById('fetch-btn').addEventListener('click', function() {
        const url = urlInput.value.trim();
        urlError.textContent = ''; // Clear previous error
        urlInput.removeAttribute('aria-invalid');
        if (!url) {
            urlFail('URL field is empty');
            return;
        }
        if (!isFetchableUrl(url)) {
            urlFail('Enter a full URL starting with https://');
            return;
        }
        fetch(url)
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.text(); // Parsed by parseJSON below, so large integers keep their digits.
                } else {
                    return response.text().then(text => {
                        if (/<!doctype html|<html/i.test(text)) {
                            throw new Error('the URL returned a web page, not JSON');
                        }
                        throw new Error('the response is not JSON');
                    });
                }
            })
            .then(text => { input.value = jsonText(parseJSON(text)); validateJSON(true, false); formatJSON(false); })
            .catch(err => urlFail(err instanceof TypeError
                ? 'Fetch error: could not load the URL. The site may be down, or it may not allow other websites to read it (CORS). Download the file and choose it instead.'
                : 'Fetch error: ' + err.message));
    });

    document.getElementById('convert-xml-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            inputFail('Input is empty');
            return;
        }
        try {
            const json = parseJSON(input.value);
            output.value = customJsonToXml(json);
            outputType = 'xml';
            showStatus('Converted to XML');
        } catch (e) { inputFail('Conversion error: ' + e.message); }
    });

    document.getElementById('convert-csv-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            inputFail('Input is empty');
            return;
        }
        try {
            const json = parseJSON(input.value);
            output.value = customJsonToCsv(json);
            outputType = 'csv';
            showStatus('Converted to CSV');
        } catch (e) { inputFail('Conversion error: ' + e.message); }
    });

    document.getElementById('convert-yaml-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            inputFail('Input is empty');
            return;
        }
        try {
            const json = parseJSON(input.value);
            output.value = unmarkBig(jsyaml.dump(json), true);
            outputType = 'yaml';
            showStatus('Converted to YAML');
        } catch (e) { inputFail('Conversion error: ' + e.message); }
    });

    function formatJSON(showErrors = false) {
        try {
            output.value = jsonText(parseJSON(input.value), 2);
            outputType = 'json';
            return true;
        } catch (e) {
            clearOutput();
            if (showErrors) {
                showError('Invalid JSON: ' + e.message);
            }
            return false;
        }
    }

    function validateJSON(silent = false, allowFix = true) {
        let value = input.value;
        try {
            JSON.parse(value);
            showValid('Valid JSON');
            return true;
        } catch (e) {
            if (!allowFix) {
                return false;
            }
            value = quoteBareKeys(value);
            try {
                JSON.parse(value);
                input.value = value;
                showValid('Fixed and valid JSON');
                return true;
            } catch (fixErr) {
                if (!silent) {
                    showError('Invalid JSON: ' + e.message);
                }
                return false;
            }
        }
    }

    // JSON.parse, except that integers too large for a JavaScript number keep every digit (see bigMarker).
    function parseJSON(text) {
        const value = JSON.parse(text); // Validity and error messages come from the native parser.
        bigMarker = '';
        if (!/\d{16}/.test(text)) {
            return value; // Every integer up to 15 digits is exact.
        }
        do {
            bigMarker = 'jsonbig' + Math.random().toString(36).slice(2) + '_';
        } while (text.includes(bigMarker));
        // The text is valid JSON, so outside strings a run of digits is always part of a number.
        return JSON.parse(text.replace(/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, token =>
            /^-?\d+$/.test(token) && !Number.isSafeInteger(Number(token)) ? '"' + bigMarker + token + '"' : token));
    }

    function isBig(value) {
        return bigMarker !== '' && typeof value === 'string' && value.startsWith(bigMarker);
    }

    // Turns marker strings in serialised output back into bare digits. YAML may wrap them in either quote.
    function unmarkBig(text, anyQuote = false) {
        if (bigMarker === '') {
            return text;
        }
        const quote = anyQuote ? '([\'"]?)' : '(")';
        return text.replace(new RegExp(quote + bigMarker + '(-?\\d+)\\1', 'g'), '$2');
    }

    function jsonText(value, indent) {
        return unmarkBig(JSON.stringify(value, null, indent));
    }

    // Quotes unquoted object keys ({a: 1} -> {"a": 1}) without touching anything inside strings.
    function quoteBareKeys(text) {
        let out = '';
        let inString = false;
        let last = ''; // last non-space character outside strings
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inString) {
                out += ch;
                if (ch === '\\') {
                    out += text[++i] || '';
                } else if (ch === '"') {
                    inString = false;
                    last = '"';
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                out += ch;
                continue;
            }
            if ((last === '{' || last === ',') && /[A-Za-z0-9_$]/.test(ch)) {
                const m = /^[A-Za-z0-9_$]+(?=\s*:)/.exec(text.slice(i));
                if (m) {
                    out += '"' + m[0] + '"';
                    i += m[0].length - 1;
                    last = '"';
                    continue;
                }
            }
            out += ch;
            if (!/\s/.test(ch)) {
                last = ch;
            }
        }
        return out;
    }

    // fetch() resolves anything else against this page (not-a-url becomes /tools/.../not-a-url).
    function isFetchableUrl(text) {
        let parsed;
        try {
            parsed = new URL(text);
        } catch (e) {
            return false; // Not an absolute URL.
        }
        return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && window.location.protocol === 'http:');
    }

    // Invalid or empty input: the old output no longer matches it, so it is cleared.
    function inputFail(msg) {
        clearOutput();
        showError(msg);
    }

    function clearOutput() {
        output.value = '';
        outputType = 'json';
    }

    // URL problems belong to the URL field; the general message is cleared so it can't contradict them.
    function urlFail(msg) {
        urlError.textContent = msg;
        urlInput.setAttribute('aria-invalid', 'true');
        showStatus('');
    }

    // Messages go to a role="status" region, so screen readers announce them.
    function showMessage(msg, type) {
        errorMsg.textContent = msg;
        errorMsg.className = 'json-tool-msg' + (type ? ' json-tool-msg--' + type : '');
    }

    function showError(msg) {
        showMessage(msg, 'error');
    }

    function showValid(msg) {
        showMessage(msg, 'valid');
    }

    function showStatus(msg) {
        showMessage(msg, '');
    }

    // One CSV cell (RFC 4180): strings and nested values are quoted, quotes doubled.
    function csvCell(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (isBig(value)) {
            return value.slice(bigMarker.length);
        }
        if (typeof value === 'object') {
            value = jsonText(value);
        }
        if (typeof value === 'string') {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return String(value);
    }

    // JSON to CSV: an array of objects becomes one row each, with a column for every key in any row;
    // an array of plain values becomes one column; a single object becomes one row.
    function customJsonToCsv(json) {
        let rows;
        if (Array.isArray(json)) {
            if (json.length === 0) {
                throw new Error('Array is empty. CSV conversion requires data.');
            }
            if (!json.some(row => typeof row === 'object' && row !== null && !Array.isArray(row))) {
                return csvCell('value') + '\n' + json.map(item => csvCell(item)).join('\n') + '\n';
            }
            rows = json;
        } else if (typeof json === 'object' && json !== null) {
            if (Object.keys(json).length === 0) {
                throw new Error('Object is empty. CSV conversion requires data.');
            }
            rows = [json];
        } else {
            return csvCell(json) + '\n';
        }
        const headers = [];
        rows.forEach(row => {
            if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
                Object.keys(row).forEach(key => { if (!headers.includes(key)) headers.push(key); });
            }
        });
        let csv = headers.map(csvCell).join(',') + '\n';
        rows.forEach(row => {
            const isObj = typeof row === 'object' && row !== null && !Array.isArray(row);
            csv += headers.map(key => csvCell(isObj ? row[key] : undefined)).join(',') + '\n';
        });
        return csv;
    }

    function xmlEscape(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    // Turns a JSON key into a valid XML element name: invalid characters become _, and names that
    // can't start an element (digits, "xml...", empty) get a leading _.
    function xmlName(key) {
        let name = String(key).replace(/[^A-Za-z0-9_.-]/g, '_');
        if (!/^[A-Za-z_]/.test(name) || /^xml/i.test(name)) {
            name = '_' + name;
        }
        return name;
    }

    // JSON to XML: objects become nested elements, array items repeat their parent's element
    // (or <item> at the top level), values are escaped and null becomes an empty element.
    function customJsonToXml(json, rootName = 'root') {
        const tag = xmlName(rootName);
        if (json === null || json === undefined) {
            return `<${tag}/>`;
        }
        if (Array.isArray(json)) {
            return `<${tag}>` + json.map(item => customJsonToXml(item, 'item')).join('') + `</${tag}>`;
        }
        if (isBig(json)) {
            return `<${tag}>${json.slice(bigMarker.length)}</${tag}>`;
        }
        if (typeof json !== 'object') {
            return `<${tag}>${xmlEscape(json)}</${tag}>`;
        }
        let xml = `<${tag}>`;
        for (const key in json) {
            const value = json[key];
            if (Array.isArray(value)) {
                value.forEach(item => { xml += customJsonToXml(item, key); });
            } else {
                xml += customJsonToXml(value, key);
            }
        }
        return xml + `</${tag}>`;
    }
});
