<script>
  import { onMount } from 'svelte';
  import { getEvents } from './lib/apiClient.js';
  import { processActivityData } from './lib/dataProcessor.js';

  let buckets = null;
  let corsError = false;
  let origin = '';

  /**
   * Finds a bucket ID from the buckets object based on the client name.
   * @param {object} allBuckets The object containing all bucket metadata.
   * @param {string} clientName The client name to search for (e.g., 'aw-watcher-afk').
   * @returns {string|null} The found bucket ID, or null.
   */
  function findBucketId(allBuckets, clientName) {
    if (!allBuckets) return null;
    const bucket = Object.values(allBuckets).find(b => b.client === clientName);
    return bucket ? bucket.id : null;
  }

  /**
   * Main data fetching and processing pipeline.
   */
  async function loadAndProcessEvents() {
    console.log("Starting data processing pipeline...");

    // Dynamically find bucket IDs from the fetched list
    const BUCKET_AFK_ID = findBucketId(buckets, 'aw-watcher-afk');
    const BUCKET_WINDOW_ID = findBucketId(buckets, 'aw-watcher-window');
    // The stopwatch bucket is special, its client is often 'aw-webui' but its ID is just 'aw-stopwatch'
    const BUCKET_STOPWATCH_ID = buckets['aw-stopwatch'] ? 'aw-stopwatch' : findBucketId(buckets, 'aw-stopwatch');

    if (!BUCKET_AFK_ID || !BUCKET_WINDOW_ID || !BUCKET_STOPWATCH_ID) {
        console.error("Could not find all required buckets. Aborting processing.", {
            afk: BUCKET_AFK_ID,
            window: BUCKET_WINDOW_ID,
            stopwatch: BUCKET_STOPWATCH_ID
        });
        return; // Stop execution if buckets aren't found
    }

    console.log("Successfully found bucket IDs:", { afk: BUCKET_AFK_ID, window: BUCKET_WINDOW_ID, stopwatch: BUCKET_STOPWATCH_ID });

    // Define a time range for the query.
    const startTime = new Date('2025-10-03T00:00:00Z').toISOString();
    const endTime   = new Date('2025-10-03T23:59:59Z').toISOString();

    console.log(`Fetching events from ${startTime} to ${endTime}`);

    try {
      // Fetch all event types in parallel for efficiency.
      const [afkEvents, windowEvents, stopwatchEvents] = await Promise.all([
        getEvents(BUCKET_AFK_ID, startTime, endTime),
        getEvents(BUCKET_WINDOW_ID, startTime, endTime),
        getEvents(BUCKET_STOPWATCH_ID, startTime, endTime)
      ]);

      // Pass the raw data to the processor.
      const processedData = await processActivityData(afkEvents, windowEvents, stopwatchEvents);

      console.log("--- PIPELINE FINISHED ---");
      console.log("Final processed data:", processedData);

    } catch (error) {
      console.error("An error occurred during the data processing pipeline:", error);
    }
  }

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
      console.log('Success! Bucket list received:', buckets);

      // After successfully getting the bucket list, start the main processing pipeline.
      await loadAndProcessEvents();

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
