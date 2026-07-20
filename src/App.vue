<template>
  <div>
    <div class="demo-controls">
      <div class="demo-field">
        <label
          for="cellWidth"
          class="demo-label"
        >cellWidth</label>
        <input
          id="cellWidth"
          v-model="options.cellWidth"
          class="demo-input"
          type="number"
          name="width"
        >
        <label
          for="scale"
          class="demo-label"
        >Scale</label>
        <input
          id="scale"
          v-model="options.scale"
          class="demo-input"
          type="number"
          name="scale"
          min="1"
          step="1"
        >
        <label
          for="show_shifts"
          class="demo-label"
        >Show Shifts</label>
        <input
          id="show_shifts"
          v-model="show_shifts"
          type="checkbox"
          name="show_shifts"
        >
      </div>
    </div>
    <VueScheduler
      v-if="!show_shifts"
      :end="end"
      :events="data"
      :headers="timelineHeaders"
      :identifiers="timelineItems"
      :options="options"
      :start="start"
      :spans="timespans"
    >
      <template #event="{ event }">
        <div class="event-body">
          <div class="event-title">
            {{ event.meta?.title }}
          </div>
          <div class="event-desc">
            {{ event.meta?.description }}
          </div>
          <div class="event-time">
            {{ event.start.toLocaleString() }}
          </div>
          <div class="event-time">
            {{ event.end.toLocaleString() }}
          </div>
        </div>
      </template>
    </VueScheduler>
    <template v-else>
      <VueShiftScheduler
        :end="end"
        :events="data"
        :headers="timelineHeaders"
        :identifiers="timelineItems"
        :options="options"
        :start="start"
        :spans="timespans"
        :shifts="shifts"
      >
        <template #event="{ event }">
          <div class="event-body">
            <div class="event-title">
              {{ event.meta?.title }}
            </div>
            <div class="event-desc">
              {{ event.meta?.description }}
            </div>
            <div class="event-time">
              {{ event.start.toLocaleString() }}
            </div>
            <div class="event-time">
              {{ event.end.toLocaleString() }}
            </div>
          </div>
        </template>
      </VueShiftScheduler>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import VueScheduler from "./components/VueScheduler.vue";
import { Event, Options, TimeSpan, Shift } from "./types/VueScheduler";
import VueShiftScheduler from "./components/VueShiftScheduler.vue";

export default defineComponent({
  name: "App",
  components: {
    VueScheduler,
    VueShiftScheduler,
  },
  setup() {
    const timelineHeaders = ref(["Route", "Start time"]);

    const timelineItems = [
      ["BMON-A", "08:00am"],
      ["BMON-B", "08:00am"],
      ["BMON-C", "08:00am"],
      ["BMON-D", "08:00am"],
      ["BMON-E", "08:00am"],
      ["BMON-F", "08:00am"],
      ["BMON-G", "08:00am"],
    ];

    const start = new Date(2024, 1, 1, 6, 0);
    const end = new Date(2024, 1, 30, 23, 0);

    const options = ref<Options>({
      cellWidth: 150,
      rowHeight: 81,
      scale: 8,
      timeFormat: "HH:mm",
      dateFormat: "yyyy-MM-dd",  
    });

    const show_shifts = ref(false);

    const data = ref<Event[]>([
      {
        identiferIdx: 0,
        start: new Date(2024, 1, 1, 6, 0),
        end: new Date(2024, 1, 1, 14, 0),
        meta: {
          title: "Event 1",
          description: "Event 1 description",
          class: "event-emerald",
        },
      },
      {
        identiferIdx: 1,
        start: new Date(2024, 1, 1, 3, 0),
        end: new Date(2024, 1, 1, 5, 0),
        meta: {
          title: "Event 2",
          description: "Event 2 description",
          class: "event-orange",
        },
      },
    ]);

    const timespans = ref<TimeSpan[]>([
      {
        start: new Date(2024, 1, 2, 0, 28),
        end: new Date(2024, 1, 3, 1, 8),
        color: "span-red",
      },
      {
        start: new Date(2024, 1, 1, 1, 28),
        end: new Date(2024, 1, 2, 4, 0),
        color: "span-green",
        timelines: [0, 2],
      },
    ]);

    const shifts = ref<Shift[]>([
      // 1st february
      {
        id: 1,
        name: "Frühschicht",
        start: new Date(2024, 1, 1, 6, 0),
        end: new Date(2024, 1, 1, 14, 0),
        color: "#3b82f6",
      },
      {
        id: 2,
        name: "Spätschicht",
        start: new Date(2024, 1, 1, 14, 0),
        end: new Date(2024, 1, 1, 22, 0),
        color: "#f59e0b",
      },
      {
        id: 3,
        name: "Nachtschicht",
        start: new Date(2024, 1, 1, 22, 0),
        end: new Date(2024, 1, 2, 6, 0),
        color: "#6366f1",
      },

      // 2nd february
      {
        id: 4,
        name: "Frühschicht",
        start: new Date(2024, 1, 2, 6, 0),
        end: new Date(2024, 1, 2, 14, 0),
        color: "#3b82f6",
      },
      {
        id: 5,
        name: "Spätschicht",
        start: new Date(2024, 1, 2, 14, 0),
        end: new Date(2024, 1, 2, 22, 0),
        color: "#f59e0b",
      },

      // 3rd february
      {
        id: 6,
        name: "Wochenenddienst",
        start: new Date(2024, 1, 3, 8, 0),
        end: new Date(2024, 1, 3, 18, 0),
        color: "#10b981",
      },

      // 5th february
      {
        id: 7,
        name: "Frühschicht",
        start: new Date(2024, 1, 5, 6, 0),
        end: new Date(2024, 1, 5, 14, 0),
        color: "#3b82f6",
      },
      {
        id: 8,
        name: "Spätschicht",
        start: new Date(2024, 1, 5, 14, 0),
        end: new Date(2024, 1, 5, 22, 0),
        color: "#f59e0b",
      },

      // 10th february
      {
        id: 9,
        name: "Sonderschicht",
        start: new Date(2024, 1, 10, 10, 0),
        end: new Date(2024, 1, 10, 16, 0),
        color: "#ef4444",
      },

      // 15th february
      {
        id: 10,
        name: "Inventur",
        start: new Date(2024, 1, 15, 7, 0),
        end: new Date(2024, 1, 15, 19, 0),
        color: "#8b5cf6",
      },
    ]);

    return {
      timelineHeaders,
      timelineItems,
      start,
      end,
      options,
      data,
      timespans,
      shifts,
      show_shifts,
    };
  },
});
</script>

<style scoped>
.demo-controls {
  max-width: 24rem;
  margin-left: auto;
  margin-right: auto;
}

.demo-field {
  margin-bottom: 1.25rem;
}

.demo-label {
  display: block;
  margin-bottom: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.demo-input {
  display: block;
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 0.75rem;
}

.demo-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.event-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #ffffff;
}

.event-title {
  font-weight: 700;
}

.event-desc {
  color: #e2e8f0;
}

.event-time {
  color: #cbd5e1;
}
</style>

<!-- Non-scoped: demo page reset + classes applied inside child components -->
<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
}

.event-emerald {
  background-color: #10b981;
  border-radius: 0.375rem;
}

.event-orange {
  background-color: #f97316;
  border-radius: 0.375rem;
}

.span-red {
  background-color: #f87171;
}

.span-green {
  background-color: #065f46;
}
</style>
