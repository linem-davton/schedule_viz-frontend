import Slider from "@mui/material/Slider";

function SliderField({ label, value, min, max, step = 1, onChange }) {
  const handleSliderChange = (_event, newValue) => {
    onChange(newValue);
  };

  const handleInputChange = (event) => {
    const nextValue = event.target.value;

    if (nextValue === "") {
      return;
    }

    onChange(Number(nextValue));
  };

  const handleInputBlur = (event) => {
    const nextValue = Number(event.target.value);

    if (Number.isNaN(nextValue)) {
      onChange(value);
      return;
    }

    onChange(Math.min(max, Math.max(min, nextValue)));
  };

  return (
    <div className="slider-card">
      <div className="slider-card-header">
        <span className="slider-label">{label}</span>
        <input
          className="slider-input"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          inputMode="numeric"
          onChange={handleInputChange}
          onBlur={handleInputBlur}
        />
      </div>
      <div className="slider-control-row">
        <Slider
          className="slider-control"
          value={value}
          min={min}
          max={max}
          step={step}
          color="primary"
          onChange={handleSliderChange}
        />
      </div>
    </div>
  );
}

export default SliderField;
