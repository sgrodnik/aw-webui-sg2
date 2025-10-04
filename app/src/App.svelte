<script>
  import { onMount } from 'svelte';

  let buckets = null;
  let corsError = false;
  let origin = '';

  onMount(async () => {
    if (typeof window !== 'undefined') {
      origin = window.location.origin;
    }

    try {
      const response = await fetch('http://localhost:5600/api/0/buckets/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      buckets = await response.json();
      console.log('Success! Data received:', buckets);
    } catch (error) {
      console.error('Error fetching data:', error);
      corsError = true;
    }
  });
</script>

<main>
  <h1>ActivityWatch Analyzer</h1>

  {#if corsError}
    <div class="error-container">
      <h2 class="error-heading">Ошибка подключения к серверу ActivityWatch</h2>
      <p>
        Похоже, ваше приложение не может подключиться к серверу ActivityWatch из-за настроек безопасности CORS.
      </p>
      <p>
        <b>Что делать:</b>
      </p>
      <ol>
        <li>Откройте файл конфигурации сервера. Обычно он находится здесь:
          <pre><code>%LocalAppData%\activitywatch\activitywatch\aw-server\aw-server.toml</code></pre>
        </li>
        <li>Найдите в файле секцию <code>[server]</code> и ключ <code>cors_origins</code>.</li>
        <li>Добавьте в список адрес вашего приложения (он может быть в кавычках или без):
          <pre><code>{origin}</code></pre>
        </li>
      </ol>
      <p><b>Пример того, как это должно выглядеть:</b></p>
      <pre><code>[server]
host = "localhost"
port = "5600"
storage = "peewee"
# ВАЖНО: не ставьте пробелы после запятых!
cors_origins = "http://localhost:8000,{origin}"

[server.custom_static]</code></pre>
      <p>
        После сохранения файла перезапустите сервер ActivityWatch и обновите эту страницу.
      </p>
    </div>
  {:else if buckets}
    <h2>Buckets Loaded:</h2>
    <ul>
      {#each Object.keys(buckets) as bucketId}
        <li>{bucketId}</li>
      {/each}
    </ul>
  {:else}
    <p>Загрузка данных с сервера ActivityWatch...</p>
  {/if}
</main>

<style>
  main {
    text-align: left;
    max-width: 800px;
  }

  .error-heading {
    color: #d00000;
  }

  pre {
    background-color: #f4f4f4;
    padding: 1em;
    white-space: pre-wrap;
    word-break: break-all;
  }

  code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
</style>
