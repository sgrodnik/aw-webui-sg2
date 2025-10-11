<script>
  import HourBlock from './HourBlock.svelte';
  import HourSummary from './HourSummary.svelte';
  import StackedBarChart from './StackedBarChart.svelte';
  import { formatDuration } from './timeUtils.js';

  export let timeViewForDay;

  // Helper functions for event filtering
  const getTaskEvents = (events) => events.filter(e => e.data.label);
  const getAggregatedWindowEvents = (events) => events.filter(e => !e.data.label);
  const getDetailedWindowEvents = (events) => events;

  // Helper functions for details view
  function getEventTitle(event) {
    if (event.data.label) {
      return `[ЗАДАЧА] ${event.data.label}`;
    }
    if (event.data.app && event.data.title) {
      return `${event.data.app} - ${event.data.title}`;
    }
    return 'Unknown Event';
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
</script>

<div class="timeline-view">
  {#if Object.keys(timeViewForDay || {}).length === 0}
    <p>Нет данных для отображения за выбранный день.</p>
  {:else}
    {#each Object.entries(timeViewForDay).sort((a, b) => parseInt(a[0]) - parseInt(b[0])) as [hour, hourData] (hour)}
      {@const detailedEvents = getDetailedWindowEvents(hourData.detailed)}
      {@const taskEvents = getTaskEvents(hourData.tasks)}
      {@const sortedDetailedEvents = [...detailedEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))}
      {@const hourSummary = hourData.summary || []}
      {@const totalHourDuration = hourSummary.reduce((acc, d) => acc + d.totalDuration, 0)}
      {@const byTitleSummary = hourSummary
          .flatMap(app => app.titles || [])
          .filter(t => t.title !== '[No Title]')
          .map(t => ({ ...t, percentage: totalHourDuration > 0 ? (t.duration / totalHourDuration) * 100 : 0 }))}

      <div class="hour-container">
        <div class="timelines-wrapper">
          <HourBlock events={taskEvents} />
          <HourBlock events={detailedEvents} />
          <HourBlock events={getAggregatedWindowEvents(hourData.aggregated)} />
        </div>

        <div class="charts-wrapper">
            <StackedBarChart 
                data={hourSummary.map(d => ({ ...d, duration: d.totalDuration }))} 
            />
            <StackedBarChart 
                data={byTitleSummary} 
            />
        </div>

        {#if sortedDetailedEvents.length > 0}
          <div class="hour-details">
            <details class="details-spoiler">
              <summary>Детали (час: {hour}, {sortedDetailedEvents.length} событий)</summary>
              
              <HourSummary summary={hourSummary} />

              <ul class="event-list">
                {#each sortedDetailedEvents as event (event.id + event.timestamp)}
                  <li>
                    <span class="event-time">{formatTime(event.timestamp)}</span>
                    <span class="event-title" title={getEventTitle(event)}>{getEventTitle(event)}</span>
                    <span class="event-duration">{formatDuration(event.duration)}</span>
                  </li>
                {/each}
              </ul>
            </details>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .timeline-view {
    padding: 1rem;
  }
  .hour-container {
    margin-bottom: 1rem; /* Reduced margin */
    padding: 0.5rem; /* Reduced padding */
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .charts-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 2px;
  }
  .timelines-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px; /* Space between timelines */
  }

  /* Details List Styles */
  .hour-details {
    margin-top: 0.5rem; /* Reduced margin */
    padding-top: 0.25rem; /* Reduced padding */
    border-top: 1px solid #f0f0f0;
  }
  .details-spoiler summary {
    cursor: pointer;
    font-weight: bold;
    color: #6c757d;
    font-size: 0.8em;
    padding: 0.1rem;
  }
  .event-list {
    list-style-type: none;
    padding-left: 1rem;
    margin-top: 0.25rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid #f0f0f0;
    color: #212529;
    font-size: 0.85em;
  }
  li:last-child {
    border-bottom: none;
  }
  .event-time {
    flex-shrink: 0;
    font-family: monospace;
    color: #6c757d;
  }
  .event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }
  .event-duration {
    flex-shrink: 0;
    font-weight: bold;
    color: #6c757d;
  }
</style>
