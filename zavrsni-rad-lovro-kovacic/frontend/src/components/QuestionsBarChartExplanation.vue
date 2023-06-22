<script setup>
import { toRefs, ref, onMounted, watchEffect } from "vue";

const props = defineProps({
	questionData: {
		required: true,
		type: Array,
	},
	width: {
		type: Number,
		default: 800,
	},
});

onMounted(() => {
	processData();
});

const { questionData, width } = toRefs(props);
const templateString = ref("");
const divWidth = ref(width.value + "px");

function processData() {
	const stringExplanation = {
		true: `In the graph above, we can see that ${questionData.value[0].correct}% of students answered option a correctly.`,
		false: `In the graph above, we can see that ${questionData.value[0].incorrect}% of students answered option a incorrectly.`,
	};

	templateString.value = stringExplanation[questionData.value[0].is_correct];
}
</script>

<template>
	<div
		v-if="questionData && questionData.length > 0"
		:style="{ width: divWidth }"
	>
		<br />When answering question with mutiple possible answers, students can
		choose not to answer <strong> (unanswered) </strong> or choose to answer
		(answer what they think is <strong> correct </strong> and leave empty what
		they think is <strong>incorrect</strong>).
		<br />
		<br />
		Both the answers and bars above them share the same color -
		<strong>green for correct, red for incorrect. </strong> Students who did not
		answer are not included in the graph.
		<br />
		<br />
		{{ templateString }}
	</div>
</template>
