<template>
	<router-link :to="routeName" style="text-decoration: none; color: inherit">
		<q-item v-ripple>
			<q-item-section v-if="icon" avatar>
				<q-icon :name="icon" />
			</q-item-section>

			<q-item-section>
				<q-item-label>{{ title }}</q-item-label>
			</q-item-section>
		</q-item>
	</router-link>
</template>

<script setup>
const props = defineProps(["icon", "title", "routeName"]);
</script>
