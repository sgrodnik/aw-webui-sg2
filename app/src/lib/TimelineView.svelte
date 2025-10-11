<script>
  import HourBlock from './HourBlock.svelte';
  import EventBar from './EventBar.svelte';

  export let data;
  export let threshold;

  let timeViewForDay = null;

  // Reactive statement to find the first available day's data
  $: {
    timeViewForDay = null;

    if (data) {
      // Find the first available day's data
      const years = Object.keys(data.time_view || {});
      if (years.length > 0) {
        const year = years[0];
        const months = Object.keys(data.time_view[year]);
        if (months.length > 0) {
          const month = months[0];
          const weeks = Object.keys(data.time_view[year][month]);
          if (weeks.length > 0) {
            const week = weeks[0];
            const days = Object.keys(data.time_view[year][month][week]);
            if (days.length > 0) {
              const day = days[0];
              timeViewForDay = data.time_view[year][month][week][day];
            }
          }
        }
      }
    }
  }

  function getStopwatchEvents(events) {
    return events.filter(e => e.data.label);
  }

  // For "Приложения (агрегировано)" track: shows the "clean" view from the processor.
  function getAggregatedWindowEvents(events) {
    if (threshold === 0) {
      return []; // This track is empty if aggregation is off
    }
    // The processor already creates the "clean" list with long events, single short events, and meta-events.
    // We just need to filter out non-window events.
    return events.filter(e => e.data.app);
  }

  // For "Приложения (детально)" track: reconstructs the original raw event list.
  function getRawWindowEvents(events) {
    // If aggregation is off, this is the main track showing all events.
    if (threshold === 0) {
      return events.filter(e => e.data.app && !e.data.is_aggregated);
    }

    const aggregatedList = getAggregatedWindowEvents(events);

    // Get all events that are not meta-events (long and single short ones)
    const nonMetaEvents = aggregatedList.filter(e => !e.data.is_aggregated);

    // Get all the original events from inside the meta-events
    const fromGroups = aggregatedList
      .filter(e => e.data.is_aggregated)
      .flatMap(e => e.data.original_events || []);
    
    return [...nonMetaEvents, ...fromGroups];
  }

</script>

<div class="timeline-container">
  <h2>Детальный вид дня</h2>

  {#if timeViewForDay}
    {#each Object.entries(timeViewForDay).sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB)) as [hour, events] (hour)}
      <div class="hour-block-container">
        <h3>Час: {hour}</h3>
        
        <div class="track-container">
            <p class="track-label">Задачи</p>
            <div class="timeline">
                {#each getStopwatchEvents(events) as event (event.id + event.timestamp)}
                    <EventBar {event} />
                {/each}
            </div>
        </div>

        <div class="track-container-group">
          <div class="track-container">
              <p class="track-label">Приложения (агрегировано)</p>
              <div class="timeline">
                  {#each getAggregatedWindowEvents(events) as event (event.id + event.timestamp)}
                      <EventBar {event} />
                  {/each}
              </div>
          </div>

          <div class="track-container detail-track">
              <p class="track-label">Приложения (детально)</p>
              <div class="timeline">
                  {#each getRawWindowEvents(events) as event (event.id + event.timestamp)}
                      <EventBar {event} />
                  {/each}
              </div>
          </div>
        </div>

        <HourBlock allEvents={events} />
      </div>
    {/each}
  {:else}
    <p>Нет почасовых данных для отображения.</p>
  {/if}
</div>

<style>
  .timeline-container {
    margin-top: 1rem;
  }

  .hour-block-container {
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    padding: 15px;
    margin-bottom: 1.5rem;
  }

  h3 {
    margin-top: 0;
    font-size: 1.2em;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 10px;
    color: #212529;
  }

  .track-container {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .track-container-group {
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .track-container-group .track-container:last-child {
    margin-bottom: 0;
  }

  .detail-track .timeline {
    background-color: #e9e9e9; /* Slightly different background for detail track */
  }

  .track-label {
    width: 150px; /* Increased width for longer labels */
    flex-shrink: 0;
    font-size: 0.9em;
    color: #6c757d;
    margin: 0;
    padding-right: 10px;
  }

  .timeline {
    position: relative;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 4px;
    width: 100%;
  }
</style>