# ActivityWatch Web UI (SG2)

This project is a web-based user interface for ActivityWatch, an open-source automated time tracker. It allows users to analyze their tracked activities and analyze their time usage.

## Features

*   **AFK Time Filtering:** Time when you are not using the computer is identified and excluded from the overall statistics. If an event (e.g., an open window) intersects with a period of inactivity, its duration is adjusted.
*   **Day Visualization:** The day is displayed as a vertical list of hourly blocks. Each block contains several parallel timelines for different event types (e.g., for tasks and for windows).
*   **Calendar Overview:** A calendar view is planned for viewing summary statistics for each day of the month, including total work time, a list of tasks, and applications used.
*   **Extensible Processing:** New data types from ActivityWatch can be added to the existing processing pipeline without a complete rebuild.

## Building and Running

1.  Navigate to the `app` directory:
    ```bash
    cd app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Build for production:
    ```bash
    npm run build
    ```
5.  Preview the production build:
    ```bash
    npm run preview
    ```

## Usage

After starting the development server, open your browser to the provided URL to view the application. The UI will fetch data from your local ActivityWatch server and display it.
