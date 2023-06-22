<template>
	<div ref="my_dataviz"></div>
</template>

<script setup>
import data from "../data/example-data.json";
import * as d3 from "d3";

import { onMounted, ref } from "vue";

const my_dataviz = ref(null);

onMounted(() => {
	drawGraph(data);
});

function drawGraph(data) {
	if (data === undefined) return;

	// postavljanje dimenzija i margina grafikona
	const margin = { top: 30, right: 30, bottom: 70, left: 60 },
		width = 460 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	// umetanje svg elementa u body
	const svg = d3
		.select(my_dataviz.value)
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	// X os
	const x = d3
		.scaleBand()
		.range([0, width])
		.domain(data.map((d) => d.Country))
		.padding(0.2);
	svg
		.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(d3.axisBottom(x))
		.selectAll("text")
		.attr("transform", "translate(-10,0)rotate(-45)")
		.style("text-anchor", "end");

	// Y os
	const y = d3.scaleLinear().domain([0, 13000]).range([height, 0]);
	svg.append("g").call(d3.axisLeft(y));

	// Stupci
	svg
		.selectAll("mybar")
		.data(data)
		.enter()
		.append("rect")
		.attr("x", (d) => x(d.Country))
		.attr("y", (d) => y(d.Value))
		.attr("width", x.bandwidth())
		.attr("height", (d) => height - y(d.Value))
		.attr("fill", "#69b3a2");
}
</script>
