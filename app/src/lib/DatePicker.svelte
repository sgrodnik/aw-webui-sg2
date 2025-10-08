<script>
  export let selectedDate;

  function onDateChange(event) {
    // We need to adjust for the timezone offset to keep the selected date consistent
    const selected = new Date(event.target.value);
    selectedDate = new Date(selected.getTime() - selected.getTimezoneOffset() * -60000);
  }
</script>

<div class="date-picker-container">
  <label for="date-picker">Select Date:</label>
  <input
    type="date"
    id="date-picker"
    value={selectedDate.toISOString().slice(0, 10)}
    on:change={onDateChange}
  />
</div>

<style>
  .date-picker-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
  }
  label {
    font-weight: bold;
    color: #212529;
  }
  input[type="date"] {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
    font-family: inherit;
  }
</style>
