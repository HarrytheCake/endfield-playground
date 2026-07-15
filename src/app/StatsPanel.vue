<script setup lang="ts">
import { useShortcuts } from '@/composables/useShortcuts';

useShortcuts();
</script>

<template>
    <UApp>
        <RouterView />
    </UApp>
</template>
