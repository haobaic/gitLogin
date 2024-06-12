<template>
  <div class="error-view">
    <h2>授权取消</h2>
    <button @click="router.replace('/')">返回首页</button>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>
<style>
.error-view button {
  width: 80px;
  height: 30px;
}
</style>
