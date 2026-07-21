<template>
  <button class="view-toggle-btn">
    <span>Icon圖標</span>
  </button>
</template>
<style scoped>
.view-toggle-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;  
  z-index: 999; 
}
</style>
<script setup>
import { ref, computed } from 'vue'
const icons = ['圖標A', '圖標B', '圖標C']
const currentIndex = ref(0)
const currentIcon = computed(() => {
  return icons[currentIndex.value]
})
const toggleView = () => {
  currentIndex.value = (currentIndex.value + 1) % icons.length
</script>
<template>
  <button class="view-toggle-btn" @click="toggleView">
    <span>{{ currentIcon }}</span>
  </button>
</template>
<script setup>
import ViewToggleBtn from '@/components/ViewToggleBtn.vue'
</script>
<template>
  <div class="canvas-container">
    <div class="my-canvas">
    </div>
    <ViewToggleBtn />
  </div>
</template>
