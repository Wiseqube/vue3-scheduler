<template>
  <VueScheduler
    :end="end"
    :events="events"
    :headers="headers"
    :identifiers="identifiers"
    :options="options"
    :start="start"
    :spans="spans"
  >
    <template #header-left>
      <div
        class="vs-shift-left-cell"
        :style="{ gridColumn: `1 / span ${headers.length}` }"
      >
        <slot name="shift-header-label">
          Schicht:
        </slot>
      </div>
    </template>


    <template #header-right="{ get_elem_left, get_elem_width, start, cell_width, scale}">
      <div class="vs-shift-track">
        <slot
          name="shift-cells"
          :get_elem_left="get_elem_left"
          :get_elem_width="get_elem_width"
          :start
          :cell_width
          :scale
        >
          <div
            v-for="shift in shifts"
            :key="shift.name + shift.start"
            class="vs-shift"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.start, cell_width, scale)}px`,
              '--shift-width': `${get_elem_width(shift.start, shift.end, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          >
            <slot :name="'shift-cell-content-' + shift.id">
              {{ shift.name }}
            </slot>
          </div>
        </slot>
      </div>
    </template>

    <!-- Visual lines for start/end of shifts -->
    <template #header-border-lines="{ get_elem_left, get_elem_width, start, cell_width, scale}">
      <div class="vs-shift-lines">
        <slot
          name="shift-border-lines"
          :get_elem_left="get_elem_left"
          :get_elem_width="get_elem_width"
          :start
          :cell_width
          :scale
        >
          <div
            v-for="(shift, index) in shifts"
            :key="index"
            class="vs-shift-line"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.start, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          />
          
          <div
            v-for="(shift, index) in shifts"
            :key="`end-${index}`"
            class="vs-shift-line"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.end, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          />
        </slot>
      </div>
    </template>
    <!-- Pass other slots to child comp -->
    <template
      v-for="(_, name) in slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps"
      />
    </template>
  </VueScheduler>
</template>

<script lang="ts">
import { defineComponent, PropType, useSlots } from "vue";
import { Options, Event, TimeSpan, Shift } from "../types/VueScheduler";
import VueScheduler from "./VueScheduler.vue";

const DEFAULT_OPTIONS: Options = {
  cellWidth: 100,
  rowHeight: 50,
  timeFormat: "HH:mm",
  dateFormat: "yyyy-MM-dd",
};

export default defineComponent({
    name: "VueShiftScheduler",
    components: { VueScheduler },
    props: {
        end: {
            type: Date,
            required: true,
        },
        events: {
            type: Array as PropType<Event[]>,
            required: true,
        },
        headers: {
            type: Array,
            required: true,
        },
        identifiers: {
            type: Array,
            required: true,
        },
        options: {
            type: Object as PropType<Options>,
            required: false,
            default: DEFAULT_OPTIONS,
        },
        start: {
            type: Date,
            required: true,
        },
        spans: {
            type: Array<TimeSpan>,
            required: false,
            default: [],
        },
        shifts: {
            type: Array as PropType<Shift[]>,
            default: () => [],
        },
    },
    setup() {
        const slots = useSlots();
        return {
            slots
        };
    }
})
</script>

<style scoped>

/* Styling for shifts */
.vs-shift-header-left {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #64748b;
  color: white;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
}

.vs-shift-header-right {
  position: relative;
  overflow: hidden;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.vs-shift-track {
  position: relative;
  height: 42px;
}

.vs-shift {
  position: absolute;
  top: 6px;
  height: 30px;
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  background-color: var(--shift-color);
  left: var(--shift-left);
  width: var(--shift-width);
}

.vs-shift-left-cell {
  display: flex;
  align-items: center;
  padding: 0.625rem;
}

/* Styling for shift lines */
.vs-shift-lines {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.vs-shift-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--shift-color);
  left: var(--shift-left);
  opacity: 1;
  pointer-events: none;
}
</style>