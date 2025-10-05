<script>
  export let hour;
  export let events;
</script>

<div class="hour-block">
  <h3>Hour: {hour}</h3>
  <p>({events.length} events)</p>
</div>

<style>
  .hour-block {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
</style>
