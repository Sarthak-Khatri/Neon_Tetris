<?php
/**
 * Site Configuration
 * 
 * This file contains all the core configuration settings for the Neon Drop game.
 * These values are used across all page templates.
 * 
 * @package NeonDrop
 * @version 1.0.0
 */

// Main site configuration array
$siteConfig = [
    // Page titles and metadata
    'projectTitle' => 'NEON DROP — The Gravity Challenge',
    'shortTitle' => 'NEON DROP',
    'pageDescription' => 'Control gravity. Master the blocks. Beat your best.',
    
    // Localization settings
    'language' => 'en',
    
    // Theme and branding
    'themeColor' => '#080b18', // Dark blue background color for mobile browsers
    
    // Asset references
    'stylesheets' => ['css/style.css', 'css/cursor.css'],
    'scripts' => ['js/main.js'], // Main entry point (ES6 module)
    
    // Security headers sent with every response
    'responseHeaders' => [
        'Content-Type' => 'text/html; charset=UTF-8',
        'X-Content-Type-Options' => 'nosniff', // Prevent MIME type sniffing
        'Referrer-Policy' => 'strict-origin-when-cross-origin' // Privacy protection
    ]
];
