# MoveQuest

MoveQuest is a classroom-focused activity platform that turns movement into a game. Students use a wearable device to capture activity data, teachers monitor participation and progress through dashboards, and the platform uses goals, leaderboards, and rewards to make physical activity more engaging.

## What MoveQuest does

MoveQuest combines three parts of the product:

- **Wearable tracking** to capture movement data from an ESP32-based device.
- **Student and teacher web experiences** for viewing activity, class progress, and engagement.
- **A device testing dashboard** for configuring and validating wearable hardware during development.

The goal of the project is to connect real-world movement with classroom motivation through gamified challenges and easy-to-read activity insights.

## Repository overview

This repository is organized into three main applications:

### `movequest-web/`

The main web application built with Next.js. It includes:

- a marketing-style landing page for the MoveQuest product
- authentication scaffolding backed by Firebase
- dashboard views for classroom activity
- API route placeholders for class creation, student enrollment, and device sync
- shared models for users, classes, devices, activities, and leaderboard data

### `movequest-dashboard/`

A separate Next.js dashboard used for hardware testing and development. It provides:

- multi-device management for ESP32 wearables
- controls for starting and stopping sessions
- motor interval configuration
- live status, recent sample activity, and recorded session summaries

### `movequest-wearable/`

The wearable firmware project built with PlatformIO for an ESP32 board. It contains:

- embedded code for the wearable device
- sensor-related dependencies
- local logs and captured test data used during device development

## Tech stack

- **Frontend:** Next.js, React, TypeScript
- **Backend services:** Firebase Authentication and Firestore integration in the web app
- **Hardware:** ESP32 + PlatformIO + Arduino framework

## Development notes

Each subproject has its own dependencies and setup:

- `movequest-web` and `movequest-dashboard` use `npm`
- `movequest-wearable` uses PlatformIO

Start by reading the README or package configuration inside the specific subproject you want to work on.
