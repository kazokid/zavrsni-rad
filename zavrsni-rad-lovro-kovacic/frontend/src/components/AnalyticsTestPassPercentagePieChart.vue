<template>
	<div class="row justify-center">
		<div ref="chartRef"></div>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect, toRefs } from "vue";
import axios from "axios";
import * as d3 from "d3";

const marginTestPC = { top: 25, right: 25, bottom: 35, left: 25 };

const widthTestPC = 300 - marginTestPC.left - marginTestPC.right;
const heightTestPC = 300 - marginTestPC.top - marginTestPC.bottom;
const radiusTestPC = Math.min(widthTestPC, heightTestPC) / 2;
const hoverRadiusIncrement = 8;
const ease = d3.easeBackOut;

const colorScaleTestPie = d3.scaleOrdinal(["limegreen", "firebrick", "blue"]);

const chartRef = ref(null);
const rendered = ref(false);
const brightness = 0.7;

const props = defineProps({
	data: {
		required: true,
		type: Array,
	},
});

const { data } = toRefs(props);

onMounted(() => {
	renderTestPieChart(data.value);
});

onUnmounted(() => {
	d3.select(chartRef.value).select("svg").remove();
});

watchEffect(() => {
	if (!rendered.value) {
		renderTestPieChart(data.value);
	}
	if (data.value) {
		updateTestPieChart(data.value);
	}
});

function renderTestPieChart(data) {
	if (data === undefined || data.length == 0) return;

	// create SVG
	const svg = d3
		.select(chartRef.value)
		.append("svg")
		.attr("class", "test-pass-percentage-piechart")
		.attr("width", widthTestPC + marginTestPC.left + marginTestPC.right)
		.attr("height", heightTestPC + marginTestPC.top + marginTestPC.bottom)
		.append("g")
		.attr(
			"transform",
			"translate(" + marginTestPC.left + "," + marginTestPC.top + ")"
		);

	const g = svg
		.append("g")
		.attr(
			"transform",
			"translate(" + widthTestPC / 2 + "," + heightTestPC / 2 + ")"
		)
		.attr("class", "arcs");

	const pie = d3
		.pie()
		.sort(null)
		.value((d) => d.percentage)(data);

	const path = d3.arc().outerRadius(radiusTestPC).innerRadius(0);

	const arc = g
		.selectAll(".arc")
		.data(pie)
		.enter()
		.append("g")
		.attr("class", "arc");

	arc
		.append("path")
		.attr("d", path)
		.attr("stroke", "white")
		.attr("stroke-width", 1)
		.attr("fill", (d) => d3.color(colorScaleTestPie(d.data.title)))
		.on("mouseover", mouseOverTestPieHandler)
		.on("mouseout", mouseOutTestPieHandler);

	arc
		.append("text")
		.attr("transform", (d) => "translate(" + path.centroid(d) + ")")
		.attr("fill", "black")
		.attr("id", (d) => `pie-text-${d.data.title}`)
		.attr("text-anchor", "middle")
		.text((d) => {
			if (d.data.percentage == 0) {
				return "";
			} else {
				return `${(d.data.percentage * 100).toFixed(0)}% ${d.data.title}`;
			}
		});

	svg
		.append("text")
		.attr("class", "test-pass-percentage-label")
		.attr("text-anchor", "middle")
		.attr(
			"transform",
			`translate(${widthTestPC / 2}, ${
				heightTestPC + marginTestPC.bottom - 10
			})`
		)
		.text("Test Pass Percentage")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.style("font-weight", "bold");

	rendered.value = true;
}

function updateTestPieChart(data) {
	if (data === undefined) return;

	if (!rendered.value) {
		renderTestPieChart(data);
	}

	const g = d3
		.select("svg.test-pass-percentage-piechart")
		.select("g")
		.select("g.arcs");

	const pie = d3
		.pie()
		.sort(null)
		.value((d) => d.percentage)(data);

	const path = d3.arc().outerRadius(radiusTestPC).innerRadius(0);

	const arc = g.selectAll("g.arc").data(pie);

	arc
		.select("path")
		.transition()
		.duration(400)
		.attrTween("d", function (d, i, arcs) {
			return arcTween(d, i, arcs, path);
		});

	const labels = arc.select("text");

	console.log(data);

	labels
		.transition()
		.duration(400)
		.attr("transform", (d) => "translate(" + path.centroid(d) + ")")
		.text((d) => {
			if (d.data.percentage == 0) {
				return "";
			} else {
				return `${(d.data.percentage * 100).toFixed(0)}% ${d.data.title}`;
			}
		});
}

function mouseOverTestPieHandler(event, d) {
	const arcOver = d3
		.arc()
		.outerRadius(radiusTestPC + hoverRadiusIncrement)
		.innerRadius(0);

	d3.select(this)
		.transition()
		.duration(400)
		.ease(ease)
		.attr("d", arcOver)
		.attr("fill", (d) =>
			d3.color(colorScaleTestPie(d.data.title)).brighter(brightness)
		)
		.attr("stroke-width", 5);

	d3.select(`#pie-text-${d.data.title}`)
		.transition()
		.duration(400)
		.ease(ease)
		.attr("transform", (d) => "translate(" + arcOver.centroid(d) + ")");
}

function mouseOutTestPieHandler(event, d) {
	const path = d3.arc().outerRadius(radiusTestPC).innerRadius(0);

	const arcOut = d3.arc().outerRadius(radiusTestPC).innerRadius(0);

	d3.select(this)
		.transition()
		.duration(400)
		.ease(ease)
		.attr("d", arcOut)
		.attr("fill", (d) => d3.color(colorScaleTestPie(d.data.title)))
		.attr("stroke-width", 2);

	d3.select(`#pie-text-${d.data.title}`)
		.transition()
		.duration(400)
		.ease(ease)
		.attr("transform", (d) => "translate(" + path.centroid(d) + ")");
}

function arcTween(d, i, arcs, path) {
	var interpolate = d3.interpolate(arcs[i], d);
	arcs[i] = interpolate(0);
	return function (t) {
		return path(interpolate(t));
	};
}
</script>
