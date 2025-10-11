<script>
  import { onMount } from 'svelte';
  import { getEvents } from './lib/apiClient.js';
  import DataWorker from './lib/dataProcessor.worker.js?worker';
  import TimelineView from './lib/TimelineView.svelte';
  import DatePicker from './lib/DatePicker.svelte';

  const worker = new DataWorker();

  let buckets = null;
  let corsError = false;
  let origin = '';
  let processedData = {};
  let isLoading = true;
  let selectedDate = new Date();
  let aggregationThreshold = 30; // Default threshold in seconds
  let showAfkInSummary = true;

  // Raw data holders for debugging
  let rawAfkEvents = [];
  let rawWindowEvents = [];

  // Helper function to get week number, must be consistent with the worker
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  // Reactive statements to derive date parts and the data for the selected day
  $: year = selectedDate.getFullYear();
  $: month = selectedDate.getMonth() + 1;
  $: day = selectedDate.getDate();
  $: week = getWeekNumber(selectedDate);
  $: timeViewForDay = processedData?.time_view?.[year]?.[month]?.[week]?.[day] || {};

  // Re-runs the pipeline whenever selectedDate, aggregationThreshold, or showAfkInSummary changes
  $: if (buckets) loadAndProcessEvents(selectedDate, aggregationThreshold, showAfkInSummary);

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
   * Triggers a browser download for the given data as a JSON file.
   * @param {object} data The data to download.
   * @param {string} filename The name of the file.
   */
  function downloadJSON(data, filename) {
    if (!data || data.length === 0) {
      alert(`Нет данных для скачивания в ${filename}`);
      return;
    }
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDebugDownload() {
    downloadJSON(rawWindowEvents, 'window-events.json');
    downloadJSON(rawAfkEvents, 'afk-events.json');
    downloadJSON(processedData, 'processed-data.json');
  }

  /**
   * Main data fetching and processing pipeline for a specific date.
   * @param {Date} date The date to fetch and process data for.
   * @param {number} threshold The aggregation threshold in seconds.
   * @param {boolean} includeAfk Whether to include AFK data in summaries.
   */
  async function loadAndProcessEvents(date, threshold, includeAfk) {
    console.log(`Starting data processing pipeline for ${date.toISOString().slice(0, 10)} with threshold ${threshold}s...`);
    isLoading = true;
    processedData = {}; // Clear previous data

    const BUCKET_AFK_ID = findBucketId(buckets, 'aw-watcher-afk');
    const BUCKET_WINDOW_ID = findBucketId(buckets, 'aw-watcher-window');
    const BUCKET_STOPWATCH_ID = buckets['aw-stopwatch'] ? 'aw-stopwatch' : findBucketId(buckets, 'aw-stopwatch');

    if (!BUCKET_AFK_ID || !BUCKET_WINDOW_ID || !BUCKET_STOPWATCH_ID) {
        console.error("Could not find all required buckets. Aborting processing.");
        isLoading = false;
        return;
    }

    const startTime = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const endTime   = new Date(date.setHours(23, 59, 59, 999)).toISOString();

    try {
      const [afkEvents, windowEvents, stopwatchEvents] = await Promise.all([
        getEvents(BUCKET_AFK_ID, startTime, endTime),
        getEvents(BUCKET_WINDOW_ID, startTime, endTime),
        getEvents(BUCKET_STOPWATCH_ID, startTime, endTime)
      ]);

      rawAfkEvents = afkEvents;
      rawWindowEvents = windowEvents;

      console.log("Sending data to worker for processing...");
      worker.postMessage({
        afkEvents,
        windowEvents,
        stopwatchEvents,
        aggregationThreshold: threshold,
        showAfkInSummary: includeAfk
      });

    } catch (error) {
      console.error("An error occurred during the data fetching:", error);
      isLoading = false;
    }
  }

  onMount(async () => {
    worker.onmessage = (event) => {
      console.log("Main thread received processed data from worker.");
      processedData = event.data;
      isLoading = false;
      console.log("--- PIPELINE FINISHED ---");
    };

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

    } catch (error) {
      console.error('Error fetching data:', error);
      corsError = true;
      isLoading = false;
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
  {:else}
    <div class="controls-container">
      <DatePicker bind:selectedDate={selectedDate} />
      <div class="threshold-control">
        <label for="threshold">Порог агрегации (сек):</label>
        <input type="number" id="threshold" min="0" bind:value={aggregationThreshold} />
      </div>
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={showAfkInSummary} />
        Учитывать AFK в сводках
      </label>
      <button on:click={handleDebugDownload}>Скачать данные для отладки</button>
    </div>
    
    {#if isLoading}
      <p>Загрузка и обработка данных...</p>
    {:else if timeViewForDay && Object.keys(timeViewForDay).length > 0}
      <TimelineView {timeViewForDay} />
    {:else}
      <p>Нет данных для отображения за {selectedDate.toLocaleDateString()}.</p>
    {/if}
  {/if}
</main>

<style>
  main {
    text-align: left;
    padding: 0;
  }

  .controls-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .threshold-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .threshold-control label {
    font-size: 0.9em;
  }

  .threshold-control input {
    width: 60px;
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
