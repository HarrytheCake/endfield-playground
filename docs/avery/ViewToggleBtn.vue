<script setup>
import { ref, computed } from 'vue'

const icons = ['view_3d', 'view_2d', 'view_top']
const currentIndex = ref(0)
const currentIcon = computed(() => icons[currentIndex.value])

const toggleView = () => {
  currentIndex.value = (currentIndex.value + 1) % icons.length
}
</script>

<template>
  <button class="view-toggle-btn" @click="toggleView">
    <span>{{ currentIcon }}</span>
  </button>
</template>

<style scoped>
.view-toggle-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}
</style>
