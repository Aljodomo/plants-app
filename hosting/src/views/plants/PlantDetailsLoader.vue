<script setup lang="ts">
import PlantDetailsVue from './PlantDetails.vue';
</script>


<template>
  <Suspense>
    <PlantDetailsVue />

    <template #fallback> Loading... </template>
  </Suspense>
</template>
