<?php
/**
 * Plugin Name: JSON Formatter & Validator
 * Description: A tool for formatting, validating, and manipulating JSON data.
 * Version: 1.8
 * Author: Dhiren Patel
 * Author URI: https://www.dhirenpatel.me/
 * License: GPL-2.0+
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function json_tool_shortcode() {
    // Enqueue assets only when shortcode is rendered
    // js-yaml is self-hosted (4.1.0, MIT); the XML and CSV converters are built in.
    wp_enqueue_script( 'js-yaml', plugins_url( '/js/vendor/js-yaml.min.js', __FILE__ ), array(), '4.1.0', true );
    wp_enqueue_script( 'json-tool-script', plugins_url( '/js/json-tool.js', __FILE__ ), array( 'js-yaml' ), '1.8', true );
    wp_enqueue_style( 'json-tool-style', plugins_url( '/css/json-tool.css', __FILE__ ), array(), '1.8' );
    ob_start();
    ?>
    <div id="json-tool">
        <div class="tool-row">
            <div class="column input-column">
                <div class="input-options">
                    <input type="file" id="file-upload" class="json-tool-visually-hidden" accept=".json,application/json" />
                    <label for="file-upload" class="file-label">Choose JSON File</label>
                    <label for="url-input" class="json-tool-visually-hidden">URL to fetch JSON from</label>
                    <input type="url" id="url-input" placeholder="Enter URL to fetch JSON" aria-describedby="url-error" />
                    <div id="url-error" class="json-tool-msg json-tool-msg--error" role="status"></div>
                    <button type="button" id="fetch-btn">Fetch</button>
                </div>
                <label for="json-input" class="json-tool-visually-hidden">JSON input</label>
                <textarea id="json-input" placeholder="Paste your JSON here..." aria-describedby="error-message"></textarea>
            </div>
            <div class="column button-column">
                <button type="button" id="format-btn">Format</button>
                <button type="button" id="validate-btn">Validate</button>
                <button type="button" id="minify-btn">Minify</button>
                <button type="button" id="copy-btn" aria-label="Copy output">Copy</button>
                <button type="button" id="download-btn">Download</button>
                <button type="button" id="convert-xml-btn">To XML</button>
                <button type="button" id="convert-csv-btn">To CSV</button>
                <button type="button" id="convert-yaml-btn">To YAML</button>
            </div>
            <div class="column output-column">
                <label for="json-output" class="json-tool-visually-hidden">Output</label>
                <textarea id="json-output" readonly></textarea>
            </div>
        </div>
        <div id="error-message" class="json-tool-msg" role="status"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'json_tool', 'json_tool_shortcode' );
