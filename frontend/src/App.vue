<template>
  <Toaster position="top-right" />
  <RouterView />
  <ThePopup />
</template>

<script setup>
import { ThePopup } from "@/components/ThePopup";
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
</script>
