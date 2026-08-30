<template>
  <div
    ref="elem"
    :class="['event', event.meta?.class]"
    :style="{
      height: `${rowHeight - 1}px`,
      width: `${getElemWidth(event.start, event.end, cellWidth, scale)}px`,
      left: `${getElemLeft(start, event.start, cellWidth, scale)}px`,
      top: `${getElemRow(event.identiferIdx, rowHeight)}px`,
    }"
    data-x="0"
    data-y="0"
    class="draggable"
  >
    <div class="event-content">
      <slot
        name="event"
        :event="event"
      />
    </div>
    <!-- resize handle -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 192 512"
      class="resize-handle"
      :style="{
        top: `${rowHeight / 3}px`,
      }"
    >
      <path
        class="resize-handle-path"
        d="M0 64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V448C64 465.7 49.67 480 32 480C14.33 480 0 465.7 0 448V64z"
      />
      <path
        class="resize-handle-path"
        d="M128 64C128 46.33 142.3 32 160 32C177.7 32 192 46.33 192 64V448C192 465.7 177.7 480 160 480C142.3 480 128 465.7 128 448V64z"
      />
    </svg>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import interact from "interactjs";
import { Target } from "@interactjs/types";
import { watchEffect } from "vue";
import { Event } from "../types/VueScheduler";
import { getElemLeft, getElemRow, getElemWidth } from "../util/position";

export default defineComponent({
  name: "Task",
  props: {
    event: {
      type: Object as PropType<Event>,
      required: true,
    },
    rowHeight: {
      type: Number,
      required: true,
    },
    cellWidth: {
      type: Number,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
  },
  emits: ["resize", "dragged"],
  setup(props, { emit }) {
    const elem = ref<Target>();
    const position = { x: 0, y: 0 };

    watchEffect((onCleanup) => {
      const element = elem.value;
      if (!element) return;
      interact(element)
        .resizable({
          // resize from all edges and corners
          edges: { left: false, right: true, bottom: false, top: false },
          listeners: {
            move(event) {
              emit("resize", { event, timelineEvent: props.event });
            },
          },
          modifiers: [
            // keep the edges inside the parent
            interact.modifiers.restrictEdges({
              outer: "parent",
            }),
          ],
          inertia: false,
        })
        .draggable({
          origin: { x: 0, y: 0 },
          listeners: {
            move: function (event) {
              position.x += event.dx;
              position.y += event.dy;

              event.target.style.setProperty(
                "--translate-x",
                `${position.x}px`,
              );
              event.target.style.setProperty(
                "--translate-y",
                `${position.y}px`,
              );
            },
            end: function (event) {
              emit("dragged", {
                timelineEvent: props.event,
                x: position.x,
                y: position.y,
              });
              position.x = 0;
              position.y = 0;
              event.target.style.setProperty(
                "--translate-x",
                `${position.x}px`,
              );
              event.target.style.setProperty(
                "--translate-y",
                `${position.y}px`,
              );
            },
          },
          modifiers: [
            interact.modifiers.snap({
              targets: [
                interact.snappers.grid({
                  x: props.cellWidth || 100,
                  y: props.rowHeight || 50,
                }),
              ],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }],
              offset: "parent",
              endOnly: true,
            }),
            interact.modifiers.restrict({
              restriction: "parent",
              elementRect: { top: 0, left: 0, bottom: 1, right: 0 },
              endOnly: false,
            }),
          ],
          inertia: true,
          autoScroll: true,
        });

        onCleanup(() => {
          interact(element).unset();
        });
      }
    );
    return {
      getElemWidth,
      getElemLeft,
      getElemRow,
      elem,
    };
  },
});
</script>
<style scoped>
.event {
  transition: width 0.05s linear;
  z-index: 10;
  position: absolute;
  display: flex;
  transform: translate(var(--translate-x, 0), var(--translate-y, 0));
  background-color: #3b82f6;
}

.event-content {
  position: sticky;
  left: calc(-1 * var(--translate-x));
}

.draggable {
  touch-action: none;
  user-select: none;
}

.resize-handle {
  position: absolute;
  right: 0;
  height: 1rem;
  width: 1rem;
}

.resize-handle-path {
  opacity: 0.4;
  fill: white;
}
</style>
