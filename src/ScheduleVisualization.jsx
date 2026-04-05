import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
const graphHeight = 340;
const fallbackGraphWidth = 720;
const minInnerGraphWidth = 220;

function ScheduleVisualization({ schedules }) {
  const svgRefs = useRef({});
  const chartShellRefs = useRef({});
  const tooltipRef = useRef(null);
  const [chartWidths, setChartWidths] = useState({});

  useEffect(() => {
    tooltipRef.current = d3
      .select("body")
      .selectAll(".schedule-tooltip")
      .data([null])
      .join("div")
      .attr("class", "schedule-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("z-index", 100)
      .style("background", "rgba(5, 12, 16, 0.92)")
      .style("border", "1px solid rgba(255, 255, 255, 0.12)")
      .style("border-radius", "14px")
      .style("padding", "10px 12px")
      .style("color", "#f4efe6")
      .style("font-size", "0.88rem")
      .style("line-height", "1.5")
      .style("box-shadow", "0 18px 48px rgba(0, 0, 0, 0.25)");

    return () => {
      d3.select("body").selectAll(".schedule-tooltip").remove();
    };
  }, []);

  useEffect(() => {
    if (!schedules) return undefined;

    const scheduleKeys = Object.keys(schedules);
    const measureWidths = () => {
      setChartWidths((previousWidths) => {
        let hasChanged = false;
        const nextWidths = { ...previousWidths };

        scheduleKeys.forEach((scheduleKey) => {
          const shellNode = chartShellRefs.current[scheduleKey];
          if (!shellNode) return;

          const nextWidth = Math.round(shellNode.getBoundingClientRect().width);
          if (nextWidth > 0 && previousWidths[scheduleKey] !== nextWidth) {
            nextWidths[scheduleKey] = nextWidth;
            hasChanged = true;
          }
        });

        return hasChanged ? nextWidths : previousWidths;
      });
    };

    measureWidths();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measureWidths);
      return () => {
        window.removeEventListener("resize", measureWidths);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      measureWidths();
    });

    scheduleKeys.forEach((scheduleKey) => {
      const shellNode = chartShellRefs.current[scheduleKey];
      if (shellNode) {
        resizeObserver.observe(shellNode);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [schedules]);

  useEffect(() => {
    if (!schedules) return;

    Object.keys(schedules).forEach((scheduleKey) => {
      const svg = d3.select(svgRefs.current[scheduleKey]);
      const svgNode = svg.node();

      if (!svgNode) {
        return;
      }

      const margin = { top: 74, right: 16, bottom: 52, left: 58 };
      const chartWidth = chartWidths[scheduleKey] ?? fallbackGraphWidth;
      const width = Math.max(
        minInnerGraphWidth,
        chartWidth - margin.left - margin.right,
      );
      const height = graphHeight - margin.top - margin.bottom;

      svg.attr("width", chartWidth);
      svg.attr("height", graphHeight);
      svg.selectAll("*").remove();

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      const algorithmName = schedules[scheduleKey].name;
      const schedule = schedules[scheduleKey].schedule;
      const nodes = Array.from(new Set(schedule.map((job) => job.node_id)));
      const endTime = d3.max(schedule.map((job) => job.end_time));
      const startTime = d3.min(schedule.map((job) => job.start_time));

      const xScale = d3
        .scaleLinear()
        .domain([startTime, endTime])
        .range([0, width]);

      const yScale = d3
        .scaleBand()
        .domain(nodes)
        .range([height, 0])
        .padding(0.18);

      g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(Math.max(4, width / 120)))
        .style("color", "#d2dee5")
        .style("font-size", "0.76rem");

      g.append("g")
        .call(d3.axisLeft(yScale))
        .style("color", "#d2dee5")
        .style("font-size", "0.76rem");

      g.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 1.45)
        .attr("text-anchor", "middle")
        .text("Time")
        .style("fill", "#d2dee5");

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 18)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Nodes")
        .style("fill", "#d2dee5");

      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text(algorithmName)
        .style("fill", "#36c690")
        .style("font-size", "1.1rem")
        .style("font-weight", "700");

      g.selectAll(".bar")
        .data(schedule)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xScale(d.start_time))
        .attr("y", (d) => yScale(d.node_id))
        .attr("width", (d) => xScale(d.end_time) - xScale(d.start_time))
        .attr("height", yScale.bandwidth())
        .attr("rx", 8)
        .attr("ry", 8)
        .style("fill", (d) => colorScale(d.task_id))
        .style("stroke", "rgba(255, 255, 255, 0.14)")
        .style("stroke-width", 1)
        .on("mouseover", (event, d) => {
          tooltipRef.current
            .interrupt()
            .style("opacity", 1)
            .html(
              `Task ${d.task_id}<br/>Start: ${d.start_time}<br/>End: ${d.end_time}`,
            )
            .style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 24}px`);
        })
        .on("mousemove", (event) => {
          tooltipRef.current
            .style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 24}px`);
        })
        .on("mouseout", () => {
          tooltipRef.current.interrupt().style("opacity", 0);
        });

      g.selectAll(".text")
        .data(schedule)
        .enter()
        .append("text")
        .attr("x", (d) => xScale(d.start_time) + 10)
        .attr("y", (d) => yScale(d.node_id) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text((d) => `${d.task_id}`)
        .style("fill", "#f4efe6")
        .style("font-size", "0.82rem")
        .style("font-weight", "700");
    });
  }, [schedules, chartWidths]);

  if (!schedules) return null;

  return (
    <div className="schedule-data">
      {Object.entries(schedules).map(([schedule]) => {
        const chartWidth = chartWidths[schedule] ?? fallbackGraphWidth;

        return (
          <div
            key={schedule}
            className="schedule-chart-shell"
            ref={(element) => (chartShellRefs.current[schedule] = element)}
          >
            <svg
              id={schedule}
              ref={(element) => (svgRefs.current[schedule] = element)}
              className="schedule-chart"
              width={chartWidth}
              height={graphHeight}
              style={{
                width: chartWidth,
                height: graphHeight,
              }}
            ></svg>
          </div>
        );
      })}
    </div>
  );
}

export default ScheduleVisualization;
