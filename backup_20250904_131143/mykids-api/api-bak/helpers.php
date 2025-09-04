<?php
// api/helpers.php
function path_parts(): array {
  $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
  $parts = array_values(array_filter(explode('/', $uri)));
  $apiPos = array_search('api', $parts);
  return $apiPos === false ? [] : array_slice($parts, $apiPos+1);
}
function id_from_tail($parts) {
  return $parts[count($parts)-1] ?? null;
}
