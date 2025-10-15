<script>
import Toast from '#components/Toast.vue';
export default {
	components: { Toast },
};
</script>

<template>
	<router-view></router-view>
	<Toast />
</template>

<style scoped></style>
