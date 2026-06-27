<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AL-Ishlah</title>
    @viteReactRefresh
    @vite('resources/js/main.jsx')
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
