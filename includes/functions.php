<?php
/**
 * Helper Functions
 * 
 * Contains reusable utility functions for security, templating, and rendering.
 * All functions are designed to be safe and prevent common security issues.
 * 
 * @package NeonDrop
 * @version 1.0.0
 */

// Load site configuration
require_once __DIR__ . '/config.php';

/**
 * Escape text for safe display in HTML
 * 
 * Converts special characters to HTML entities to prevent XSS attacks.
 * Always use this function when outputting user-provided or dynamic content.
 * 
 * @param mixed $value The value to escape (will be cast to string)
 * @return string The HTML-safe escaped string
 */
function escapeHtml($value): string
{
    return htmlspecialchars(
        (string) $value,
        ENT_QUOTES | ENT_SUBSTITUTE, // Encode both single and double quotes
        'UTF-8' // Use UTF-8 encoding
    );
}

/**
 * Send configured HTTP response headers
 * 
 * Applies security and content-type headers from the site configuration.
 * Only sends headers if they haven't been sent already.
 * 
 * @param array $headers Associative array of header name => header value
 * @return void
 */
function sendConfiguredHeaders(array $headers): void
{
    // Check if headers have already been sent
    if (headers_sent()) {
        return;
    }

    // Send each configured header
    foreach ($headers as $name => $value) {
        header($name . ': ' . $value, true);
    }
}

/**
 * Render a menu action button or link
 * 
 * Generates HTML for main menu buttons. Supports both links and buttons
 * with optional arrow indicators.
 * 
 * @param array $action Configuration array with keys:
 *                      - href: URL for links (optional, creates <a> instead of <button>)
 *                      - id: Element ID for buttons (optional)
 *                      - label: Display text (required)
 *                      - class: CSS classes (optional, defaults to button-secondary)
 *                      - arrow: Whether to show arrow indicator (optional)
 * @return void Outputs HTML directly
 */
function renderMenuAction(array $action): void
{
    ?>
    <?php if (!empty($action['href'])): ?>
        <!-- Render as link -->
        <a<?php if (!empty($action['id'])): ?> id="<?= escapeHtml($action['id']) ?>"<?php endif; ?>
           class="<?= escapeHtml($action['class'] ?? 'button button-secondary') ?>" 
           href="<?= escapeHtml($action['href']) ?>">
            <?php if (!empty($action['icon'])): ?><span class="menu-action-icon" aria-hidden="true"><?= escapeHtml($action['icon']) ?></span><?php endif; ?>
            <span class="menu-action-copy"><span class="menu-action-title"><?= escapeHtml($action['label'] ?? '') ?></span>
                <?php if (!empty($action['description'])): ?><small><?= escapeHtml($action['description']) ?></small><?php endif; ?>
            </span>
            <?php if (!empty($action['arrow'])): ?>
                <span aria-hidden="true">↗</span>
            <?php endif; ?>
        </a>
    <?php else: ?>
        <!-- Render as button -->
        <button class="<?= escapeHtml($action['class'] ?? 'button button-secondary') ?>" 
                id="<?= escapeHtml($action['id'] ?? '') ?>" 
                type="button">
            <?php if (!empty($action['icon'])): ?><span class="menu-action-icon" aria-hidden="true"><?= escapeHtml($action['icon']) ?></span><?php endif; ?>
            <span class="menu-action-copy"><span class="menu-action-title"><?= escapeHtml($action['label'] ?? '') ?></span>
                <?php if (!empty($action['description'])): ?><small><?= escapeHtml($action['description']) ?></small><?php endif; ?>
            </span>
            <?php if (!empty($action['arrow'])): ?>
                <span aria-hidden="true">↗</span>
            <?php endif; ?>
        </button>
    <?php endif; ?>
    <?php
}

/**
 * Count UTF-8 characters safely
 * 
 * Counts actual characters in a UTF-8 string, not bytes.
 * Handles malformed sequences safely.
 * 
 * @param string $value The string to count
 * @return int Number of characters, or PHP_INT_MAX if malformed
 */
function utf8CharacterCount(string $value): int
{
    // Match any single character (including multi-byte)
    $count = preg_match_all('/./us', $value, $matches);
    
    // Return count, or max int if regex fails (malformed UTF-8)
    return $count === false ? PHP_INT_MAX : $count;
}

/**
 * Render a keyboard control hint
 * 
 * Displays a control instruction with keyboard key indicators.
 * Used in the controls panel and instructions.
 * 
 * @param array $hint Configuration array with keys:
 *                    - label: Control description (e.g., "MOVE")
 *                    - keys: Array of key names (e.g., ['←', '→'])
 * @return void Outputs HTML directly
 */
function renderControlHint(array $hint): void
{
    ?>
    <li>
        <span><?= escapeHtml($hint['label'] ?? '') ?></span>
        <?php foreach (($hint['keys'] ?? []) as $key): ?>
            <kbd><?= escapeHtml($key) ?></kbd>
        <?php endforeach; ?>
    </li>
    <?php
}
