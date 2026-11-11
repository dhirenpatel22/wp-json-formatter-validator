document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    const errorMsg = document.getElementById('error-message');
    const fileUpload = document.getElementById('file-upload');
    const urlInput = document.getElementById('url-input');
    const urlError = document.getElementById('url-error');

    // Auto-format and validate on input (skip error for blank)
    input.addEventListener('input', function() {
        if (input.value.trim() === '') {
            errorMsg.textContent = ''; // Clear error if blank
            return;
        }
        validateJSON(true); // Silent mode for real-time
        formatJSON(false);
    });

    document.getElementById('format-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            showError('Input is empty');
            return;
        }
        if (formatJSON(true)) {
            showStatus('Formatted');
        }
    });

    document.getElementById('validate-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            showError('Input is empty');
            return;
        }
        validateJSON(false);
    });

    document.getElementById('minify-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            showError('Input is empty');
            return;
        }
        try {
            const json = JSON.parse(input.value);
            output.value = JSON.stringify(json);
            showStatus('Minified');
        } catch (e) {
            showError('Invalid JSON: ' + e.message);
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
        const blob = new Blob([output.value], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        a.click();
        showStatus('Downloaded formatted.json');
    });

    fileUpload.addEventListener('change', function(e) {
        const reader = new FileReader();
        reader.onload = function(event) { input.value = event.target.result; validateJSON(true); formatJSON(false); };
        reader.readAsText(e.target.files[0]);
    });

    document.getElementById('fetch-btn').addEventListener('click', function() {
        const url = urlInput.value.trim();
        urlError.textContent = ''; // Clear previous error
        urlInput.removeAttribute('aria-invalid');
        if (!url) {
            urlFail('URL field is empty');
            return;
        }
        fetch(url)
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    return response.text().then(text => {
                        if (/<!doctype html|<html/i.test(text)) {
                            throw new Error('the URL returned a web page, not JSON');
                        }
                        throw new Error('the response is not JSON');
                    });
                }
            })
            .then(data => { input.value = JSON.stringify(data); validateJSON(true); formatJSON(false); })
            .catch(err => urlFail('Fetch error: ' + err.message));
    });

    document.getElementById('convert-xml-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            showError('Input is empty');
            return;
        }
        try {
            const json = JSON.parse(input.value);
            output.value = customJsonToXml(json);
            showStatus('Converted to XML');
        } catch (e) { showError('Conversion error: ' + e.message); }
    });

    document.getElementById('convert-csv-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            showError('Input is empty');
            return;
        }
        try {
            const json = JSON.parse(input.value);
            output.value = customJsonToCsv(json);
            showStatus('Converted to CSV');
        } catch (e) { showError('Conversion error: ' + e.message); }
    });

    document.getElementById('convert-yaml-btn').addEventListener('click', function() {
        if (input.value.trim() === '') {
            showError('Input is empty');
            return;
        }
        try {
            const json = JSON.parse(input.value);
            output.value = jsyaml.dump(json);
            showStatus('Converted to YAML');
        } catch (e) { showError('Conversion error: ' + e.message); }
    });

    function formatJSON(showErrors = false) {
        try {
            const json = JSON.parse(input.value);
            output.value = JSON.stringify(json, null, 2);
            return true;
        } catch (e) {
            if (showErrors) {
                showError('Invalid JSON: ' + e.message);
            }
            return false;
        }
    }

    function validateJSON(silent = false) {
        let value = input.value;
        try {
            JSON.parse(value);
            showValid('Valid JSON');
            return true;
        } catch (e) {
            value = value.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
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

    // Custom JSON to CSV function (handles various JSON structures)
    function customJsonToCsv(json) {
        // Handle different JSON structures
        if (Array.isArray(json)) {
            if (json.length === 0) {
                throw new Error('Array is empty. CSV conversion requires data.');
            }
            // Check if it's an array of objects
            if (typeof json[0] === 'object' && json[0] !== null) {
                const headers = Object.keys(json[0]);
                let csv = headers.join(',') + '\n';
                json.forEach(row => {
                    const values = headers.map(key => {
                        const value = row[key];
                        if (value === null || value === undefined) {
                            return '';
                        }
                        if (typeof value === 'object') {
                            return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
                        }
                        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
                    });
                    csv += values.join(',') + '\n';
                });
                return csv;
            } else {
                // Array of primitive values
                return json.map(item => `"${item}"`).join(',');
            }
        } else if (typeof json === 'object' && json !== null) {
            // Single object - convert to single row
            const headers = Object.keys(json);
            if (headers.length === 0) {
                throw new Error('Object is empty. CSV conversion requires data.');
            }
            let csv = headers.join(',') + '\n';
            const values = headers.map(key => {
                const value = json[key];
                if (value === null || value === undefined) {
                    return '';
                }
                if (typeof value === 'object') {
                    return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
                }
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csv += values.join(',') + '\n';
            return csv;
        } else {
            // Primitive value
            return `"${json}"`;
        }
    }

    // Custom JSON to XML function (basic recursive conversion)
    function customJsonToXml(json, rootName = 'root') {
        let xml = `<${rootName}>`;
        for (const key in json) {
            const value = json[key];
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        xml += customJsonToXml(item, key);
                    });
                } else {
                    xml += customJsonToXml(value, key);
                }
            } else {
                xml += `<${key}>${value}</${key}>`;
            }
        }
        xml += `</${rootName}>`;
        return xml;
    }
});
