<?php
/*
 * psues.com brochure lead form handler. Plain PHP, no libraries.
 * The repository is public: this file must never contain passwords, keys or tokens.
 *
 * Flow: validate -> drop spam -> append CSV (outside the web root, fallback _leads/) -> email -> redirect.
 */
declare(strict_types=1);

const NOTIFY_TO   = 'markting@psues.com';
const MAIL_FROM   = 'noreply@psues.com';
const MIN_SECONDS = 3;
const LANGS       = ['en', 'fr', 'de', 'nl', 'es'];
const INTERESTS   = ['buy' => 'Buy', 'rent' => 'Rent', 'both' => 'Both'];

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Content-Type: text/plain; charset=utf-8');
    echo "This address only receives the brochure form on psues.com.\nOpen https://psues.com/brochure to read the villa brochure.\n";
    exit;
}

function field(string $key, int $max): string
{
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) {
        return '';
    }
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v);
    if ($v === null) {               // invalid UTF-8
        return '';
    }
    $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}

function go(string $url): void
{
    header('Location: ' . $url, true, 303);
    exit;
}

$lang = field('lang', 2);
if (!in_array($lang, LANGS, true)) {
    $lang = 'en';
}
$page = field('page', 120);
if (!preg_match('#^/[a-z0-9/_-]*$#', $page)) {
    $page = '/';
}
$thanks = '/brochure?thanks=1' . ($lang === 'en' ? '' : '&lang=' . $lang);
$back   = $page . '?lead=error#brochure-form';

// ---- spam: honeypot filled -> pretend success, store nothing
if (field('website', 200) !== '') {
    go($thanks);
}
// ---- spam: sent too fast after page load (ts = JS milliseconds), or no timestamp
$ts = field('ts', 20);
if (!ctype_digit($ts) || (microtime(true) * 1000 - (float)$ts) < MIN_SECONDS * 1000) {
    go($back);
}

// ---- validate
$name     = field('name', 100);
$email    = field('email', 254);
$whatsapp = field('whatsapp', 30);
$country  = field('country', 60);
$interest = field('interest', 10);
$consent  = field('consent', 5);

$ok = $name !== ''
    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
    && ($whatsapp === '' || preg_match('#^[0-9+()./ -]{6,30}$#', $whatsapp))
    && isset(INTERESTS[$interest])
    && $consent === 'yes'
    && !preg_match('/[<>]/', $name . $country);
if (!$ok) {
    go($back);
}

$ua = substr(preg_replace('/[\x00-\x1F\x7F]+/', ' ', (string)($_SERVER['HTTP_USER_AGENT'] ?? '')) ?? '', 0, 300);
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
$date = gmdate('Y-m-d H:i:s') . ' UTC';
$row = [$date, $name, $email, $whatsapp, $country, INTERESTS[$interest], $lang, $page, $ua, $ip];

// ---- store
function csv_safe(string $v): string
{
    // stop spreadsheet formula injection
    return ($v !== '' && strpos("=+-@\t\r", $v[0]) !== false) ? "'" . $v : $v;
}

function append_csv(string $dir, array $row, bool $protect): bool
{
    if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
        return false;
    }
    if ($protect && !is_file($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }
    $file = $dir . '/leads.csv';
    $new = !is_file($file);
    $fh = @fopen($file, 'ab');
    if ($fh === false) {
        return false;
    }
    $ok = flock($fh, LOCK_EX);
    if ($ok && $new) {
        fputcsv($fh, ['date_utc', 'name', 'email', 'whatsapp', 'country', 'interest', 'lang', 'page', 'user_agent', 'ip'], ',', '"', '\\');
    }
    $ok = $ok && fputcsv($fh, array_map('csv_safe', $row), ',', '"', '\\') !== false;
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

$docroot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? __DIR__), '/');
if ($docroot === '') {
    $docroot = __DIR__;
}
$stored = 'outside web root';
if (!append_csv(dirname($docroot) . '/psues_leads', $row, false)) {
    $stored = append_csv($docroot . '/_leads', $row, true) ? 'fallback _leads folder' : 'NOT STORED';
}

// ---- email
$subject = 'New villa lead: ' . $name . ' (' . ($country !== '' ? $country : 'country not given') . ')';
$body = "New brochure request from psues.com\n\n"
    . "Date:      $date\n"
    . "Name:      $name\n"
    . "Email:     $email\n"
    . "WhatsApp:  " . ($whatsapp !== '' ? $whatsapp : '-') . "\n"
    . "Country:   " . ($country !== '' ? $country : '-') . "\n"
    . "Interest:  " . INTERESTS[$interest] . "\n"
    . "Language:  $lang\n"
    . "Page:      https://psues.com$page\n"
    . "IP:        $ip\n"
    . "Browser:   $ua\n\n"
    . "Saved to CSV: $stored\n";
$headers = implode("\r\n", [
    'From: Psusennes website <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,           // validated email, cannot contain line breaks
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);
$encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$mailed = @mail(NOTIFY_TO, $encSubject, $body, $headers, '-f' . MAIL_FROM);
if (!$mailed) {
    $mailed = @mail(NOTIFY_TO, $encSubject, $body, $headers);
}

if ($stored === 'NOT STORED' && !$mailed) {
    error_log('psues lead.php: lead could not be stored or emailed');
    go($back);
}
go($thanks);
