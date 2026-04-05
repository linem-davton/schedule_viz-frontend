import SliderField from "./SliderField";

function SlidersAM({ highlightNode, graph, setGraph }) {
  const highlightedNode = graph.tasks.find((node) => node.id === highlightNode);

  if (!graph || highlightNode == null || highlightedNode == undefined) {
    return <div></div>;
  }

  const handleSliderChange = (slider, newValue) => {
    setGraph((prevGraph) => {
      const updatedNodes = prevGraph.tasks.map((node) => {
        if (node.id === highlightNode) {
          return { ...node, [slider]: newValue };
        }
        return node;
      });

      return { ...prevGraph, tasks: updatedNodes };
    });
  };

  return (
    <div className="sliders">
      <div className="inspector-header">
        <div>
          <h4>Task {highlightedNode.id}</h4>
        </div>
      </div>

      <SliderField
        label="WCET"
        value={highlightedNode.wcet}
        min={1}
        max={100}
        step={1}
        onChange={(newValue) => handleSliderChange("wcet", newValue)}
      />

      <SliderField
        label="Deadline"
        value={highlightedNode.deadline}
        min={1}
        max={1000}
        step={1}
        onChange={(newValue) => handleSliderChange("deadline", newValue)}
      />
    </div>
  );
}

export default SlidersAM;
