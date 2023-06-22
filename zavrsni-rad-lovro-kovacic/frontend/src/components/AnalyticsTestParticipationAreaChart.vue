<template>
	<div class="row col-12 justify-end area-toggle-legend">
		<q-checkbox
			v-model="showInProgress"
			keep-color
			color="primary"
			label="In progress"
		></q-checkbox>
		<q-checkbox
			v-model="showSubmitted"
			keep-color
			color="secondary"
			label="Submitted"
		></q-checkbox>
	</div>
	<div ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect, toRefs } from "vue";
import * as d3 from "d3";

const showInProgress = ref(true);
const showSubmitted = ref(true);

const props = defineProps({
	data: {
		required: true,
	},
	width: {
		type: Number,
		default: 800,
	},
	height: {
		type: Number,
		default: 400,
	},
});

const { data } = toRefs(props);

const chartRef = ref(null);

const marginTP = { top: 25, right: 35, bottom: 150, left: 75 };
const marginTP2 = { top: 400, right: 35, bottom: 30, left: 75 };

const widthTP = props.width - marginTP.left - marginTP.right;
const heightTP = props.height - marginTP.top - marginTP.bottom;
const heightTP2 = props.height - marginTP2.top - marginTP2.bottom;

const dateOptions = {
	weekday: "short",
	day: "numeric",
	month: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
};

const duration = 500;

onMounted(() => {
	renderTestParticipationAreaChart();
	updateTestParticipationAreaChart(data.value, [
		showInProgress.value,
		showSubmitted.value,
	]);
});

onUnmounted(() => {
	d3.select(chartRef.value).selectAll("svg").remove();
});

watchEffect(() => {
	updateTestParticipationAreaChart(data.value, [
		showInProgress.value,
		showSubmitted.value,
	]);
});

function renderTestParticipationAreaChart() {
	// create SVG
	const svg = d3
		.select(chartRef.value)
		.append("svg")
		.attr("width", widthTP + marginTP.left + marginTP.right)
		.attr("height", heightTP + marginTP.top + marginTP.bottom);

	const focus = svg
		.append("g")
		.attr("class", "focus")
		.attr("transform", `translate(${marginTP.left}, ${marginTP.top})`);

	const context = svg
		.append("g")
		.attr("class", "context")
		.attr("transform", `translate(${marginTP2.left}, ${marginTP2.top})`);

	svg
		.append("defs")
		.append("clipPath")
		.attr("id", "clip")
		.append("rect")
		.attr("width", widthTP)
		.attr("height", heightTP);

	// create axis labels
	focus
		.append("text")
		.attr("class", "x-axis-label-scatter")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${widthTP / 2}, ${heightTP + 40})`)
		.text("Time")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	focus
		.append("text")
		.attr("class", "y-axis-label-scatter")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${-45}, ${heightTP / 2}) rotate(-90)`)
		.text("Participants")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	d3.select("body")
		.append("div")
		.attr("class", "tooltip-lg tooltip-areachart")
		.style("opacity", 0);

	// create scales
	const xScale = d3.scaleTime().domain([0, 0]).range([0, widthTP]).nice();

	const xScale2 = d3.scaleTime().domain([0, 0]).range([0, widthTP]).nice();

	const yScale = d3.scaleLinear().domain([0, 0]).range([heightTP, 0]);

	// create axes
	const xAxis = d3.axisBottom(xScale);
	const xAxis2 = d3.axisBottom(xScale2);
	const yAxis = d3.axisLeft(yScale);

	const selectTestMessage = "Select an exam";

	checkEmptyAreaChart([], selectTestMessage, []);

	focus
		.append("g")
		.attr("class", "x-axis-areachart")
		.attr("transform", `translate(0, ${heightTP})`)
		.call(xAxis);

	context
		.append("g")
		.attr("class", "x-axis-areachart-brush")
		.attr("transform", `translate(0, ${heightTP2})`)
		.call(xAxis2);

	focus.append("g").attr("class", "y-axis-areachart").call(yAxis);

	const nullPath = d3.line();

	// // Area for started test instances
	// focus
	// 	.append("path")
	// 	.attr("class", "area area-started clip-path red-area")
	// 	.attr("opacity", 0)
	// 	.attr("d", nullPath([]));

	// focus
	// 	.append("path")
	// 	.attr("class", "line line-started clip-path red-line")
	// 	.attr("opacity", 0)
	// 	.attr("d", nullPath([]));

	// // Area for started test instances on brush
	// context
	// 	.append("path")
	// 	.attr("class", "area area-started red-area")
	// 	.attr("opacity", 0)
	// 	.attr("d", nullPath([]));

	// context
	// 	.append("path")
	// 	.attr("class", "line line-started red-line")
	// 	.attr("opacity", 0)
	// 	.attr("d", nullPath([]));

	// Area for submitted test instances
	focus
		.append("path")
		.attr("class", "area area-submitted clip-path green-area")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	focus
		.append("path")
		.attr("class", "line line-submitted clip-path green-line")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	// Area for submitted test instances on brush
	context
		.append("path")
		.attr("class", "area area-submitted green-area")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	context
		.append("path")
		.attr("class", "line line-submitted green-line")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	// Area for open test instances
	focus
		.append("path")
		.attr("class", "area area-open clip-path blue-area")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	focus
		.append("path")
		.attr("class", "line line-open clip-path blue-line")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	// Area for open test instances on brush
	context
		.append("path")
		.attr("class", "area area-open blue-area")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	context
		.append("path")
		.attr("class", "line line-open blue-line")
		.attr("opacity", 0)
		.attr("d", nullPath([]));

	context.append("g").attr("class", "brush");

	focus
		.append("line")
		.attr("class", "test-areachart-vertical")
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.attr("y1", 0)
		.attr("y2", heightTP);

	focus
		.append("rect")
		.attr("width", widthTP)
		.attr("height", heightTP)
		.attr("class", "zoom tooltip-area-rect");

	// const legendData = [
	// 	{ title: "In progress" },
	// 	{ title: "Started" },
	// 	{ title: "Submitted" },
	// ];

	// const legend = focus
	// 	.selectAll(".legend-part")
	// 	.data(legendData)
	// 	.enter()
	// 	.append("g")
	// 	.attr("class", "legend-part")
	// 	.attr("font-family", "sans-serif")
	// 	.attr("font-size", 10)
	// 	.attr("text-anchor", "end")
	// 	.attr("transform", function (d, i) {
	// 		return "translate(0," + i * 20 + ")";
	// 	});

	// legend
	// 	.append("rect")
	// 	.attr("x", widthTP + marginTP.right - 19)
	// 	.attr("width", 19)
	// 	.attr("height", 19)
	// 	.attr("fill", (d) => colorScaleAreaLegend(d.title));

	// legend
	// 	.append("text")
	// 	.attr("x", widthTP + marginTP.right - 24)
	// 	.attr("y", 9.5)
	// 	.attr("dy", "0.32em")
	// 	.text((d) => d.title);
}

function updateTestParticipationAreaChart(data, selection) {
	if (data === undefined || selection === undefined) {
		return;
	}

	// const svg = d3.select(chartRef.value).select("svg");
	const focus = d3.select(chartRef.value).select("svg").select("g.focus");
	const context = d3.select(chartRef.value).select("svg").select("g.context");
	let xScale = d3.scaleTime().domain([0, 0]).range([0, widthTP]).nice();

	let xScale2 = d3.scaleTime().domain([0, 0]).range([0, widthTP]).nice();

	let yScale = d3.scaleLinear().domain([0, 0]).range([heightTP, 0]);

	let yScale2;

	let xAxis = d3.axisBottom(xScale);
	let xAxis2 = d3.axisBottom(xScale2);
	let yAxis = d3.axisLeft(yScale);

	const isOpenSelected = selection[0];
	// const isStartedSelected = selection.includes("started");
	const isSubmittedSelected = selection[1];

	const emptySelectionMessage = "Empty selection";

	if (!checkEmptyAreaChart(data, emptySelectionMessage, selection)) {
		if (data === undefined || data.length === 0) {
			return;
		}
		// calculate new data format
		const startingTimes = data.map((d) => new Date(d.ts_started));

		const submittingTimes = data
			.filter((d) => d.ts_submitted !== null)
			.map((d) => new Date(d.ts_submitted));

		const timestamps = startingTimes.concat(submittingTimes);
		timestamps.sort(sortDatesAsc);

		const dateFrom = timestamps[0];
		const dateTo = timestamps[timestamps.length - 1];

		// update x-scale
		xScale = d3
			.scaleTime()
			.domain([dateFrom, dateTo])
			.range([0, widthTP])
			.nice();

		xScale2 = d3
			.scaleTime()
			.domain([dateFrom, dateTo])
			.range([0, widthTP])
			.nice();

		const newData = timestamps.map((date) => {
			const started = data.filter((d) => new Date(d.ts_started) <= date).length;
			const submitted = data.filter(
				(d) => d.ts_submitted !== null && new Date(d.ts_submitted) <= date
			).length;
			return {
				date,
				open: started - submitted,
				started,
				submitted,
			};
		});

		data = newData;

		const maxStarted = d3.max(newData, (d) => d.started);

		let areaOpen, areaSubmitted;
		let lineOpen, lineSubmitted;

		// update y-scale
		yScale = d3.scaleLinear().domain([0, maxStarted]).range([heightTP, 0]);

		yScale2 = d3.scaleLinear().domain([0, maxStarted]).range([heightTP2, 0]);

		xAxis = d3.axisBottom(xScale);
		xAxis2 = d3.axisBottom(xScale2);
		yAxis = d3.axisLeft(yScale);

		if (isOpenSelected) {
			// create paths for open
			areaOpen = d3
				.area()
				.x((d) => xScale(d.date))
				.y0(heightTP)
				.y1((d) => yScale(d.open));

			lineOpen = d3
				.line()
				.x((d) => xScale(d.date))
				.y((d) => yScale(d.open));

			// on brush
			const areaOpen2 = d3
				.area()
				.x((d) => xScale2(d.date))
				.y0(heightTP2)
				.y1((d) => yScale2(d.open));

			const lineOpen2 = d3
				.line()
				.x((d) => xScale2(d.date))
				.y((d) => yScale2(d.open));

			// update paths for open
			focus
				.select("path.area-open")
				.transition()
				.duration(duration)
				.attr("d", areaOpen(newData))
				.attr("opacity", 0.8);

			focus
				.select("path.line-open")
				.transition()
				.duration(duration)
				.attr("d", lineOpen(newData))
				.attr("opacity", 0.8);

			// update paths for open on brush
			context
				.select("path.area-open")
				.transition()
				.duration(duration)
				.attr("d", areaOpen2(newData))
				.attr("opacity", 0.8);

			context
				.select("path.line-open")
				.transition()
				.duration(duration)
				.attr("d", lineOpen2(newData))
				.attr("opacity", 0.8);
		} else {
			// remove paths for open
			focus
				.select("path.area-open")
				.transition()
				.duration(duration)
				.attr("opacity", 0);

			focus
				.select("path.line-open")
				.transition()
				.duration(duration)
				.attr("opacity", 0);

			context
				.select("path.area-open")
				.transition()
				.duration(duration)
				.attr("opacity", 0);

			context
				.select("path.line-open")
				.transition()
				.duration(duration)
				.attr("opacity", 0);
		}

		if (isSubmittedSelected) {
			// create paths for submitted
			areaSubmitted = d3
				.area()
				.x((d) => xScale(d.date))
				.y0(heightTP)
				.y1((d) => yScale(d.submitted));

			lineSubmitted = d3
				.line()
				.x((d) => xScale(d.date))
				.y((d) => yScale(d.submitted));

			const areaSubmitted2 = d3
				.area()
				.x((d) => xScale2(d.date))
				.y0(heightTP2)
				.y1((d) => yScale2(d.submitted));

			const lineSubmitted2 = d3
				.line()
				.x((d) => xScale2(d.date))
				.y((d) => yScale2(d.submitted));

			// update paths for submitted
			focus
				.select("path.area-submitted")
				.transition()
				.duration(duration)
				.attr("d", areaSubmitted(newData))
				.attr("opacity", 0.8);

			focus
				.select("path.line-submitted")
				.transition()
				.duration(duration)
				.attr("d", lineSubmitted(newData))
				.attr("opacity", 0.8);

			// update paths for submitted on brush
			context
				.select("path.area-submitted")
				.transition()
				.duration(duration)
				.attr("d", areaSubmitted2(newData))
				.attr("opacity", 0.8);

			context
				.select("path.line-submitted")
				.transition()
				.duration(duration)
				.attr("d", lineSubmitted2(newData))
				.attr("opacity", 0.8);
		} else {
			// remove paths for submitted
			focus
				.select("path.area-submitted")
				.transition()
				.duration(duration)
				.attr("opacity", 0);

			focus
				.select("path.line-submitted")
				.transition()
				.duration(duration)
				.attr("opacity", 0);

			context
				.select("path.area-submitted")
				.transition()
				.duration(duration)
				.attr("opacity", 0);

			context
				.select("path.line-submitted")
				.transition()
				.duration(duration)
				.attr("opacity", 0);
		}

		const zoom = d3
			.zoom()
			.scaleExtent([1, Infinity])
			.translateExtent([
				[0, 0],
				[widthTP, heightTP],
			])
			.extent([
				[0, 0],
				[widthTP, heightTP],
			])
			.on("zoom", zoomed);

		var isUpdating = false;

		function brushed(event) {
			// Added isUpdating flag to prevent infinite loop
			if (
				(event.sourceEvent && event.sourceEvent.type === "zoom") ||
				isUpdating
			)
				return;
			isUpdating = true;

			let s = event.selection || xScale2.range();

			xScale.domain(s.map(xScale2.invert, xScale2));
			if (areaOpen) {
				focus.select("path.area-open").attr("d", areaOpen(newData));
				focus.select("path.line-open").attr("d", lineOpen(newData));
			}
			if (areaSubmitted) {
				focus.select("path.area-submitted").attr("d", areaSubmitted(newData));
				focus.select("path.line-submitted").attr("d", lineSubmitted(newData));
			}
			focus.select(".x-axis-areachart").call(xAxis);
			focus
				.select(".zoom")
				.call(
					zoom.transform,
					d3.zoomIdentity.scale(widthTP / (s[1] - s[0])).translate(-s[0], 0)
				);

			isUpdating = false;
		}

		const brush = d3
			.brushX()
			.extent([
				[0, 0],
				[widthTP, heightTP2],
			])
			.on("brush end", brushed);

		function zoomed(event) {
			// Added isUpdating flag to prevent infinite loop
			if (event.sourceEvent && event.sourceEvent.type === "brush") return;
			if (isUpdating) return;
			isUpdating = true;

			var t = event.transform;
			xScale.domain(t.rescaleX(xScale2).domain());
			if (areaOpen) {
				focus.select("path.area-open").attr("d", areaOpen(newData));
				focus.select("path.line-open").attr("d", lineOpen(newData));
			}
			// if (areaStarted) {
			// 	focus.select("path.area-started").attr("d", areaStarted(newData));
			// 	focus.select("path.line-started").attr("d", lineStarted(newData));
			// }
			if (areaSubmitted) {
				focus.select("path.area-submitted").attr("d", areaSubmitted(newData));
				focus.select("path.line-submitted").attr("d", lineSubmitted(newData));
			}
			focus.select(".x-axis-areachart").call(xAxis);
			context
				.select(".brush")
				.call(brush.move, xScale.range().map(t.invertX, t));

			isUpdating = false;
		}

		context.select(".brush").call(brush).call(brush.move, xScale.range());

		focus.select(".zoom").call(zoom);
	} else {
		focus
			.selectAll("path.area")
			.transition()
			.duration(duration)
			.attr("opacity", 0);

		focus
			.selectAll("path.line")
			.transition()
			.duration(duration)
			.attr("opacity", 0);

		context
			.selectAll("path.area")
			.transition()
			.duration(duration)
			.attr("opacity", 0);

		context
			.selectAll("path.line")
			.transition()
			.duration(duration)
			.attr("opacity", 0);
	}

	focus
		.selectAll("g.x-axis-areachart")
		.transition()
		.duration(duration)
		.call(xAxis);

	context
		.selectAll("g.x-axis-areachart-brush")
		.transition()
		.duration(duration)
		.call(xAxis2);

	focus
		.selectAll("g.y-axis-areachart")
		.transition()
		.duration(duration)
		.call(yAxis);

	const vertical = d3.select(".test-areachart-vertical");

	const bisectDate = d3.bisector(function (d) {
		return d.date;
	}).left;

	var mousex = undefined;

	const rect = d3
		.select(".tooltip-area-rect")
		.on("mouseover", function (event) {
			mousex = d3.pointer(event);
			mousex = mousex[0];
			vertical.attr("x1", mousex + "px").attr("x2", mousex + "px");

			const tooltip = d3.select(".tooltip-areachart");
			tooltip.transition().duration(200).style("opacity", 0.8);

			tooltip
				.style("left", event.pageX + "px")
				.style("top", event.pageY + "px");

			vertical.attr("stroke-opacity", 1);
		})
		.on("mousemove", function (event) {
			mousex = d3.pointer(event);
			mousex = mousex[0];
			vertical.attr("x1", mousex + "px").attr("x2", mousex + "px");

			const x0 = xScale.invert(mousex),
				i = bisectDate(data, x0, 1);

			const tooltip = d3.select(".tooltip-areachart");
			tooltip
				.style("left", event.pageX + "px")
				.style("top", event.pageY + "px");

			let d, d0, d1;
			if (i >= 0 && i < data.length) {
				d0 = data[i - 1];
				d1 = data[i];
				d = x0 - d0.date > d1.date - x0 ? d1 : d0;
			} else if (i < 0) {
				d0 = data[0];
				d1 = data[1];
				d = x0 - d0.date > d1.date - x0 ? d1 : d0;
			} else {
				d0 = data[data.length - 2];
				d1 = data[data.length - 1];
				d = x0 - d0.date > d1.date - x0 ? d1 : d0;
			}
			if (isSubmittedSelected && isOpenSelected) {
				tooltip.html(`<b>Time: ${d.date.toLocaleDateString("hr", dateOptions)}
                  <br>In progress: ${d.open}
                  <br>Submitted: ${d.submitted}</b>`);
			} else if (isSubmittedSelected) {
				tooltip.html(`<b>Time: ${d.date.toLocaleDateString("hr", dateOptions)}
									<br>Submitted: ${d.submitted}</b>`);
			} else if (isOpenSelected) {
				tooltip.html(`<b>Time: ${d.date.toLocaleDateString("hr", dateOptions)}
									<br>In progress: ${d.open}</b>`);
			}
		})
		.on("mouseout", function () {
			const tooltip = d3.select(".tooltip-areachart");
			tooltip.style("opacity", 0);

			vertical.attr("stroke-opacity", 0);
		});
}

function checkEmptyAreaChart(data, message, selection) {
	const focus = d3.select(chartRef.value).select("svg").select("g.focus");

	const emptySel = focus.selectAll("text.message").data(message);

	if (data.length === 0 || selection.length === 0) {
		emptySel.text(message);

		emptySel
			.enter()
			.append("text")
			.text(message)
			.attr("text-anchor", "middle")
			.attr("x", widthTP / 2)
			.attr("y", heightTP / 2)
			.attr("font-size", "16px")
			.attr("fill", "black")
			.attr("class", "message")
			.style("fill-opacity", 1e-6)
			.transition()
			.duration(200)
			.style("fill-opacity", 1);
		return true;
	}

	emptySel
		.data({})
		.exit()
		.transition()
		.duration(duration)
		.style("fill-opacity", 1e-6)
		.remove();

	return false;
}

function sortDatesAsc(date1, date2) {
	if (date1 > date2) return 1;
	if (date1 < date2) return -1;
	return 0;
}
</script>

<style>
.area-toggle-legend {
	padding-right: 70px;
}
</style>
