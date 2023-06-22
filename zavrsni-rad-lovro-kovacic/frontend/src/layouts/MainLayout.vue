<template>
	<q-layout view="lHh Lpr lFf" class="background-main">
		<q-header elevated>
			<q-toolbar class="my-toolbar">
				<q-btn
					flat
					dense
					round
					icon="menu"
					aria-label="Menu"
					@click="toggleLeftDrawer"
				/>
				<q-toolbar-title> Local Edgar </q-toolbar-title>
				<q-select
					class="q-ma-sm dropdown-menu"
					v-if="courses.length > 0"
					v-model="course"
					:options="courses"
					option-value="id"
					option-label="course_acronym"
					label="Course"
					dense
					rounded
				/>
				<q-select
					class="q-ma-sm dropdown-menu"
					v-if="academicYears.length > 0"
					v-model="academicYear"
					:options="academicYears"
					option-value="id"
					option-label="title"
					label="Academic Year"
					dense
					rounded
				/>

				<q-img
					src="~assets/edgar.png"
					alt="Edgar"
					width="40px"
					class="q-ml-lg"
				/>
			</q-toolbar>
		</q-header>

		<q-drawer v-model="leftDrawerOpen" show-if-above bordered>
			<q-list>
				<q-item-label header> Essential Links </q-item-label>

				<EssentialLink
					v-for="link in linksList"
					:key="link.title"
					v-bind="link"
				/>
			</q-list>
		</q-drawer>

		<q-page-container>
			<router-view :academicYear="academicYear" :course="course" />
		</q-page-container>
	</q-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import EssentialLink from "components/EssentialLink.vue";

import axios from "axios";

const academicYear = ref({
	id: 2022,
	title: "2022/2023",
});
const academicYears = ref([]);
const course = ref({
	id: 2017,
	course_name: "Napredni razvoj programske potpore za web",
	course_acronym: "WEB2",
});
const courses = ref([]);

const fetchCourses = async () => {
	try {
		const response = await axios.get("http://localhost:4000/courses");

		courses.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	}
};

const fetchYears = async () => {
	try {
		const response = await axios.get("http://localhost:4000/years");

		academicYears.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	}
};

const linksList = [
	{
		title: "Individual Question Analytics",
		icon: "bar_chart",
		routeName: "/edgar/questions-bar-chart",
	},
	{
		title: "Exam Analytics",
		icon: "bar_chart",
		routeName: "/edgar/exam-analytics",
	},
];

const leftDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
	leftDrawerOpen.value = !leftDrawerOpen.value;
};

onMounted(() => {
	fetchCourses();
	fetchYears();
});
</script>

<style scoped>
.my-toolbar {
	background-color: #dee7f1;
	color: #1e1e1e;
}

.dropdown-menu {
	width: 150px;
}
</style>
