# Project Overview

This project is a web-based user interface for ActivityWatch, an open-source automated time tracker. It allows users to analyze their tracked activities and analyze their time usage.

## Main Technologies

*   **Frontend:** svelte
*   **Backend:**  ActivityWatch REST API, OpenAPI (Swagger) 2.0

## Architecture

The application is a single-page application (SPA) that runs entirely in the browser. It communicates with a local ActivityWatch server to fetch data. Its core feature is a decoupled processing pipeline: a central data processor (`dataProcessor.js`) fetches raw events and transforms them into two independent, view-ready data models: a clean "aggregated" view and a raw "detailed" view. This ensures that the UI components are simple and only responsible for displaying data, not processing it. A Web Worker (`dataProcessor.worker.js`) provides a parallel implementation for background processing.

## Key Files

*   `input/swagger.json`: The OpenAPI (Swagger) 2.0 specification for the ActivityWatch REST API. This is the most important file in the project, as it describes all the available API endpoints, their parameters, and their responses.
*   `app/src/App.svelte`: The main Svelte component that serves as the entry point. It orchestrates the data fetching pipeline, manages application state (like the selected date), and passes the final, processed data down to the view components.
*   `app/src/lib/apiClient.js`: A module responsible for all communication with the ActivityWatch REST API. It handles fetching events from the server.
*   `app/src/lib/dataProcessor.js`: The core of the application's logic. This module is responsible for fetching raw data from ActivityWatch, filtering it by activity, cleaning inconsistencies, and transforming it into two separate data models for the UI: a clean "aggregated" view (with short events grouped into meta-events) and a raw "detailed" view.
*   `app/src/lib/dataProcessor.worker.js`: Contains the core data processing logic that runs in a background Web Worker. It handles filtering raw data, cleaning inconsistencies (like AFK overlaps), and healing data gaps by extending events to ensure continuous time tracking. It also aggregates consecutive short events into "meta-events" to reduce visual noise and calculates hourly summaries, including optional AFK time.
*   `app/src/lib/DatePicker.svelte`: A UI component that allows the user to select a date for analysis.
*   `app/src/lib/TimelineView.svelte`: The container for the "Detailed Day View". It organizes data into hourly blocks, visualizes events on multiple parallel tracks, and integrates stacked bar charts for hourly summaries.
*   `app/src/lib/HourBlock.svelte`: A component that displays a collapsible list of all events within a single hour.
*   `app/src/lib/HourSummary.svelte`: A UI component that renders the hour summary, showing a breakdown of time spent per application and task.
*   `app/src/lib/StackedBarChart.svelte`: A minimalist component for rendering a stacked bar chart, used for visualizing hourly time distribution.
*   `app/src/lib/EventBar.svelte`: A component responsible for the visual representation of a single event on a timeline track.
*   `app/src/lib/timeUtils.js`: A utility module for shared time-related functions, like formatting durations.
*   `app/src/main.js`: The entry point for the frontend application, responsible for initializing the Svelte app.
*   `app/package.json`: Lists the project's dependencies and defines scripts for building, developing, and testing.
*   `input/*.json`: Sample data from the ActivityWatch API. These files can be used to understand the structure of the data returned by the API.

... to be countinued

## Usage

... to be countinued

## Building and Running

... to be countinued

## План работ

План работ и задачи по проекту описаны в файле `input/anchor-context.md`. Прогресс по задачам отслеживается в этом же файле. По мере выполнения работ, нужно обновлять как `input/anchor-context.md`, так и поддерживать актуальность информации в текущем документе.
