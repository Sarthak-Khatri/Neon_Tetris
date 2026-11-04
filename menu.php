<?php
require_once __DIR__ . '/includes/functions.php';
sendConfiguredHeaders($siteConfig['responseHeaders']);

$requestMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($requestMethod, ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD', true);
    exit('Method not allowed.');
}

// Keep the previous menu URL working while sharing the interactive menu.
header('Location: game.php', true, 302);
exit;
