<script>
export default {
	created() {
		document.title = 'Privacy Policy | GRAB Tools';
	},
};
</script>

<template>
	<main id="privacy-policy">
		<h2>Privacy Policy</h2>
		Welcome to Grab Tools! Your privacy is important to us. This Privacy
		Policy explains what information we collect, how we use it, and how you
		can manage your data. Effective Date: 20 Oct 2025

		<h3>1. Information We Collect</h3>
		We may collect the following information from users: User ID (a unique
		identifier assigned to you by Meta when you log in) to connect your
		account. Public profile information (such as your name and profile
		picture) if you log in via Meta. Your user age group to check whether
		you are under the age of 13.

		<h3>2. How We Use Your Information</h3>
		We use the collected information to: Authenticate your login and create
		your account. Display and personalize your experience with your profile
		name and picture. Enforce age restrictions by verifying your age group
		before allowing account creation.

		<h3>3. How to Request Data Deletion</h3>
		You have the right to request that we delete any personal data we have
		collected about you. If you wish to delete your data, please contact us
		at:<br />
		Email: {{ this.$config.SUPPORT_EMAIL }}<br />
		We will process your request within 30 days of receiving it.

		<h3>4. Third-Party Services</h3>
		We may use third-party services (such as Meta login) that collect
		information according to their own privacy policies. Please review their
		policies separately.

		<h3>5. Changes to This Privacy Policy</h3>
		We may update this Privacy Policy from time to time. Updates will be
		posted on this page with a revised effective date.

		<h3>6. Contact Us</h3>
		If you have any questions about this Privacy Policy, you can contact us
		at:<br />
		Email: {{ this.$config.SUPPORT_EMAIL }}
	</main>
</template>

<style scoped>
h3 {
	margin-block: 1rem 0.1rem;
}
</style>
