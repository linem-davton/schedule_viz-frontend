import SliderField from "./SliderField";

function SlidersPM({ highlightedEdge, graph, setGraph }) {
  const edge = graph?.links?.find(
    (item) =>
      item.start_node == highlightedEdge.start_node &&
      item.end_node == highlightedEdge.end_node,
  );

  if (!edge) {
    return <div></div>;
  }

  const handleSliderChange = (slider, newValue) => {
    setGraph((prevGraph) => {
      const updatedEdges = prevGraph.links.map((currentEdge) => {
        if (currentEdge.id === edge.id) {
          return { ...currentEdge, [slider]: newValue };
        }
        return currentEdge;
      });

      return { ...prevGraph, links: updatedEdges };
    });
  };

  return (
    <div className="sliders">
      <div className="inspector-header">
        <div>
          <h4>
            Link {edge.start_node} -&gt; {edge.end_node}
          </h4>
        </div>
      </div>

      <SliderField
        label="Delay"
        value={edge.link_delay}
        min={1}
        max={100}
        step={1}
        onChange={(newValue) => handleSliderChange("link_delay", newValue)}
      />

      <SliderField
        label="Bandwidth"
        value={edge.bandwidth}
        min={1}
        max={100}
        step={1}
        onChange={(newValue) => handleSliderChange("bandwidth", newValue)}
      />
    </div>
  );
}

export default SlidersPM;
