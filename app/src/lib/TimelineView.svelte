<script>
  import HourBlock from './HourBlock.svelte';

  export let timeViewForDay;

  // These functions now simply filter the pre-separated event arrays.
  const getTaskEvents = (events) => events.filter(e => e.data.label);
  const getAggregatedWindowEvents = (events) => events.filter(e => !e.data.label);
  const getDetailedWindowEvents = (events) => events;

</script>

<div class="timeline-view">
  {#if Object.keys(timeViewForDay || {}).length === 0}
    <p>Нет данных для отображения за выбранный день.</p>
  {:else}
    {#each Object.entries(timeViewForDay).sort((a, b) => parseInt(a[0]) - parseInt(b[0])) as [hour, hourData] (hour)}
      <div class="hour-block-container">
        <h3>Час: {hour}</h3>
        <HourBlock 
          title="Задачи" 
          events={getTaskEvents(hourData.tasks)} 
        />
        <HourBlock 
          title="Приложения (агрегировано)" 
          events={getAggregatedWindowEvents(hourData.aggregated)} 
        />
        <HourBlock 
          title="Приложения (детально)" 
          events={getDetailedWindowEvents(hourData.detailed)} 
        />
      </div>
    {/each}
  {/if}
</div>

<style>
  .timeline-view {
    padding: 1rem;
  }
  .hour-block-container {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  h3 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
</style>