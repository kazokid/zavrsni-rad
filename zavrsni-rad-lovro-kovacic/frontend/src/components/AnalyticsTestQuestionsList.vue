<template>
	<div class="row q-mt-xl justify-center">
		<div class="test-title q-mb-lg">Exam Questions</div>
		<div class="row justify-around">
			<div
				v-for="(question, index) in data"
				id="question-box"
				:key="index"
				class="rounded-borders-black row col-3 q-ma-sm q-pa-sm justify-start"
				:class="
					question.id == 1
						? 'question-graph-box-big'
						: 'question-graph-box-small'
				"
			>
				<div class="q-ma-sm test-title">ID: {{ question.id_question }}</div>
				<AnalyticsTestQuestionGraphSmall
					class="col-12 q-ma-sm"
					:questionData="question"
					:academicYear="academicYear"
					:width="question.id == 1 ? 650 : 235"
					:renderAnswersGraph="question.id == 1 ? true : false"
					:height="250"
				/>
			</div>
		</div>
	</div>
</template>

<script setup>
import { toRefs } from "vue";

import AnalyticsTestQuestionGraphSmall from "./AnalyticsTestQuestionGraphSmall.vue";

const props = defineProps({
	data: {
		required: true,
		type: Array,
	},
	academicYear: {
		required: true,
		type: Object,
	},
});

const { data, academicYear } = toRefs(props);
</script>

<style scoped>
.rounded-borders-black {
	border: 1px solid black;
	border-radius: 5px;
}

.question-graph-box-big {
	width: 850px;
	height: 350px;
}

.question-graph-box-small {
	width: 450px;
	height: 350px;
}
</style>
