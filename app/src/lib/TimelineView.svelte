<script>
  import HourBlock from './HourBlock.svelte';
  import EventBar from './EventBar.svelte';

  export let data;

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

  function getWindowEvents(events) {
    return events.filter(e => e.data.app);
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

        <div class="track-container">
            <p class="track-label">Приложения</p>
            <div class="timeline">
                {#each getWindowEvents(events) as event (event.id + event.timestamp)}
                    <EventBar {event} />
                {/each}
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

  .track-label {
    width: 80px; /* Fixed width for labels */
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