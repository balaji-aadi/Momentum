import React, { useState } from "react";
import "./templateMaster.style.css";
import { RxCross2 } from "react-icons/rx";
import { RxCrossCircled } from "react-icons/rx";

const TemplateMaster = () => {
  const [components, setComponents] = useState([
    { name: "", inputs: [{ label: "", value: "" }] },
  ]);

  const handleComponentChange = (index, event) => {
    const { name, value } = event.target;
    const values = [...components];
    values[index][name] = value;
    setComponents(values);
  };

  const handleInputChange = (componentIndex, inputIndex, event) => {
    const { name, value } = event.target;
    const values = [...components];
    values[componentIndex].inputs[inputIndex][name] = value;
    setComponents(values);
  };

  const handleAddComponent = () => {
    setComponents([
      ...components,
      { name: "", inputs: [{ label: "", value: "" }] },
    ]);
  };

  const handleRemoveComponent = (index) => {
    const values = [...components];
    values.splice(index, 1);
    setComponents(values);
  };

  const handleAddInput = (index) => {
    const values = [...components];
    values[index].inputs.push({ label: "", value: "" });
    setComponents(values);
  };

  const handleRemoveInput = (componentIndex, inputIndex) => {
    const values = [...components];
    values[componentIndex].inputs.splice(inputIndex, 1);
    setComponents(values);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Submitted component data:", components);
  };

  return (
    <main className="form-container">
      <h1 className="form-title">Dynamic Component Form</h1>
      <form onSubmit={handleSubmit} className="form">
        {components.map((component, componentIndex) => (
          <section key={componentIndex} className="component-group">
            <div className="form-group">
              <div className="form__inputs__wrapper">
                <label
                  htmlFor={`componentName-${componentIndex}`}
                  className="form-label"
                >
                  Component Name <span style={{ color: "red" }}>*</span>
                </label>

                <input
                  type="text"
                  id={`componentName-${componentIndex}`}
                  name="name"
                  value={component.name}
                  onChange={(event) =>
                    handleComponentChange(componentIndex, event)
                  }
                  required
                  className="input__text"
                  style={{
                    width: "50%",
                    marginTop: "0rem",
                    textTransform: "capitalize",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveComponent(componentIndex)}
                className="remove-button component_remove_button"
              >
                <RxCross2 style={{ fontSize: "1.8rem" }} />
              </button>
            </div>

            {component.inputs.map((input, inputIndex) => (
              <div key={inputIndex} className="form-group">
                <section
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)",
                    padding: "18px 10px",
                    gap: "1rem",
                  }}
                >
                  <div className="form__inputs__wrapper">
                    <label
                      htmlFor={`label-${componentIndex}-${inputIndex}`}
                      className="form-label"
                    >
                      Label
                    </label>
                    <input
                      type="text"
                      id={`label-${componentIndex}-${inputIndex}`}
                      name="label"
                      value={input.label}
                      onChange={(event) =>
                        handleInputChange(componentIndex, inputIndex, event)
                      }
                      className="form-input"
                    />
                  </div>

                  {/* <div className="form__inputs__wrapper">
                    <label
                      htmlFor={`input-${componentIndex}-${inputIndex}`}
                      className="form-label"
                    >
                      Input
                    </label>
                    <input
                      type="text"
                      id={`input-${componentIndex}-${inputIndex}`}
                      name="value"
                      value={input.value}
                      onChange={(event) =>
                        handleInputChange(componentIndex, inputIndex, event)
                      }
                      className="form-input"
                    />
                  </div> */}
                </section>

                <button
                  type="button"
                  onClick={() => handleRemoveInput(componentIndex, inputIndex)}
                  className="remove-button"
                >
                  <RxCrossCircled style={{ fontSize: "1.2rem" }} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddInput(componentIndex)}
              className="add-input-button"
            >
              Add Input
            </button>
          </section>
        ))}
        <section className="form-btns">
          <button
            type="button"
            onClick={handleAddComponent}
            className="add-button"
          >
            Add Another Component
          </button>
          <button type="submit" className="submit-button">
            Submit
          </button>
        </section>
      </form>
    </main>
  );
};

export default TemplateMaster;
