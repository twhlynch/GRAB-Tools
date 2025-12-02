<script>
import Toast from '@/components/Toast.vue';
import CookiesPopup from './components/CookiesPopup.vue';
export default {
	components: { Toast, CookiesPopup },
};
</script>

<template>
	<router-view></router-view>
	<Toast />
	<CookiesPopup />
</template>

<style scoped></style>
