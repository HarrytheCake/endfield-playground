<template>
  <div ref="rootEl" class="base-region-selector">
    <button
      type="button"
      class="base-region-selector__trigger"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleOpen"
    >
      基地選擇
      <span class="base-region-selector__caret" :class="{ 'is-open': isOpen }">▾</span>
    </button>

    <ul
      v-if="isOpen"
      class="base-region-selector__menu"
      role="listbox"
      aria-label="基地選擇選項"
    >
      <li
        v-for="option in options"
        :key="option.value ?? 'free'"
        role="option"
        :aria-selected="option.value === modelValue"
      >
        <button
          type="button"
          class="base-region-selector__option"
          :class="{ 'is-active': option.value === modelValue }"
          @click="handleSelect(option.value)"
        >
          {{ option.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export type BaseRegion = 'wuling' | 'valley4' | null

interface Option {
  label: string
  value: BaseRegion
}

interface Props {
  modelValue: BaseRegion
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BaseRegion): void
}>()

const options: Option[] = [
  { label: '武陵地區', value: 'wuling' },
  { label: '四號谷地', value: 'valley4' },
  { label: '自由畫布', value: null },
]

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function handleSelect(value: BaseRegion) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.base-region-selector {
  position: relative;
  display: inline-block;
}

.base-region-selector__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--border-default, #d9d9d9);
  border-radius: 6px;
  background: var(--surface-default, #fff);
  color: var(--text-primary, #111);
  cursor: pointer;
}

.base-region-selector__trigger:hover {
  background: var(--surface-hover, #f5f5f5);
}

.base-region-selector__caret {
  font-size: 10px;
  transition: transform 0.15s ease;
}

.base-region-selector__caret.is-open {
  transform: rotate(180deg);
}

.base-region-selector__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  margin: 0;
  padding: 4px;
  list-style: none;
  border: 1px solid var(--border-default, #d9d9d9);
  border-radius: 8px;
  background: var(--surface-default, #fff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

.base-region-selector__option {
  display: block;
  width: 100%;
  padding: 6px 10px;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary, #111);
  cursor: pointer;
}

.base-region-selector__option:hover {
  background: var(--surface-hover, #f5f5f5);
}

.base-region-selector__option.is-active {
  background: var(--surface-active, #eef2ff);
  font-weight: 600;
}
</style>