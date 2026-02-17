import React, { useEffect, useRef, useState } from "react";
import "./sharedInputs.style.css";
import Select from "react-select";
import { FaCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";
import { vendor } from "../Template/demo";
import { IoMdArrowDropdown } from "react-icons/io";

const SharedInputs = React.memo(
  ({
    inputData,
    handleChange,
    handleSelect,
    className,
    labelValue,
    index = 0,
    sharedContainerWidth,
  }) => {
    return (
      <div
        className="shared__inputs__container"
        style={{ width: sharedContainerWidth ? sharedContainerWidth : null }}
      >
        {inputData.map((input, ind) => {
          switch (input?.inputType) {
            case "basic":
              return (
                <BasicInput
                  input={input}
                  ind={ind}
                  key={ind}
                  handleChange={handleChange}
                  className={className}
                  labelValue={labelValue}
                  index={index}
                />
              );
            case "select":
              return (
                <SelectInput
                  input={input}
                  ind={ind}
                  handleSelect={handleSelect}
                  className={className}
                />
              );
            case "search-select":
              return (
                <SelectInput
                  input={input}
                  ind={ind}
                  handleSelect={handleSelect}
                  className={className}
                  labelValue={labelValue}
                  index={index}
                />
              );
            case "textarea":
              return (
                <TextAreaInput
                  input={input}
                  ind={ind}
                  key={ind}
                  handleChange={handleChange}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }
);

const BasicInput = ({
  input,
  ind,
  handleChange,
  className,
  labelValue,
  index,
}) => {
  const [focus, setFocus] = useState(false);
  const [isSection, setIsSection] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [query, setQuery] = useState("");

  const sectionRef = useRef();
  const inputRef = useRef(null);

  const handleInputChange = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (!isSection) {
      setQuery("");
    }
  }, [isSection]);

  useEffect(() => {
    const handler = (e) => {
      if (!sectionRef.current?.contains(e.target)) {
        setIsSection(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const filteredVendors = vendor.filter((ven) =>
    ven.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleCheckAll = (e) => {
    e.preventDefault();
    const newCheckedItems = {};
    vendor.forEach((ven) => {
      newCheckedItems[ven.id] = true;
    });
    setCheckedItems(newCheckedItems);
  };

  const handleUncheckAll = (e) => {
    e.preventDefault();
    const newCheckedItems = {};
    vendor.forEach((ven) => {
      newCheckedItems[ven.id] = false;
    });
    setCheckedItems(newCheckedItems);
  };

  const handleCheckboxChange = (id) => {
    setCheckedItems((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const length = `${
    Object.values(checkedItems).filter((value) => value === true).length
  } checked`;

  return (
    <main
      className="basic__input__container"
      style={{
        marginRight: input.type === "checkbox" ? "2rem" : "",
        padding: className ? "1rem 0.3rem" : "1rem",
      }}
    >
      {labelValue ? null : (
        <label
          htmlFor={ind}
          style={{
            top: className ? "-1.4rem" : input.checkboxinput ? "0" : "",
          }}
          className={
            input.checkboxinput
              ? "label not_float"
              : input.type === "date" && input.required === false
              ? "label not__float"
              : input.type !== "checkbox"
              ? (focus || input.value) && !className
                ? "floating__label"
                : input.insideInputLabel
                ? "label inside__input"
                : "label"
              : "label_checkbox"
          }
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          {input.labelName}
          {input.required && <span className="required__field">*</span>}
        </label>
      )}
      <input
        type={input.type}
        required={input.required}
        style={{
          borderBottomColor: focus
            ? "#3141a1"
            : input.value
            ? "green"
            : "rgba(0, 0, 0, .25)",
          height: input.type === "checkbox" ? "1rem" : "",
          width:
            input.type === "checkbox"
              ? "2rem"
              : input.width
              ? input.width
              : input.staticWidth
              ? "18.5vw"
              : "",
          cursor: input.disabled ? "not-allowed" : "",
          borderBottom: input.disabled ? "1px dashed #bcbcbc" : "",
          color: input.disabled ? "#bcbcbc" : "",
          textAlign: input.textAlign ? input.textAlign : "",
          padding: className ? "0px 10px" : "",
        }}
        name={input.name}
        id={ind}
        className={
          className
            ? className
            : `input__text ${input.value ? "value__active" : ""} ${
                input.staticWidth ? "static__width" : ""
              }`
        }
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        value={input.checkboxinput ? length : input.value}
        checked={input.checked ? Boolean(input.checked) : null}
        onChange={(e) => handleChange(e, input.name, index)}
        placeholder={input.checkboxinput ? "Select Suppliers" : null}
        disabled={input.disabled}
        onClick={
          input.checkboxinput
            ? () => {
                setIsSection(!isSection);
                handleInputChange();
              }
            : null
        }
        readOnly={input.checkboxinput ? true : false}
      />

      {input.checkboxinput && (
        <i style={{ position: "absolute", right: "1.5rem", top: "0.5rem" }}>
          <IoMdArrowDropdown style={{ fontSize: "1.5rem", color: "#ccc" }} />
        </i>
      )}

      {(focus && input.checkboxinput) || isSection ? (
        <section className="multi__checkbox__section" ref={sectionRef}>
          <div className="multi__checkbox__topSection">
            <button onClick={handleCheckAll}>
              <span>
                <FaCheck style={{ fontSize: "0.8rem" }} />
              </span>
              Check All
            </button>
            <button onClick={handleUncheckAll}>
              <span>
                <ImCross style={{ fontSize: "0.8rem" }} />
              </span>
              UnCheck All
            </button>
          </div>
          <div className="multi__checkbox__searchBar">
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => setQuery(e.target.value)}
              ref={inputRef}
            />
          </div>
          <div className="multi__checkbox__contentContainer">
            {filteredVendors.map((ven, ind) => (
              <div className="multi__checkbox__content" key={ind}>
                <input
                  type="checkbox"
                  id={ven.id}
                  // checked={checkedItems[ven.id] || null}
                  checked={!!checkedItems[ven.id]}
                  onChange={() => handleCheckboxChange(ven.id)}
                />
                <label htmlFor={ven.id}> {ven.name} </label>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
};

const TextAreaInput = ({ input, ind, handleChange }) => {
  const [focus, setFocus] = useState(false);

  return (
    <main className="basic__input__description ">
      <label
        htmlFor={ind}
        className={focus || input.value ? "floating__label" : "label"}
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        {input.labelName}
        {input.required && <span className="required__field">*</span>}
      </label>
      <textarea
        type={input.type}
        required={input.required}
        style={{ borderColor: focus ? "#3141a1" : "rgba(0, 0, 0, .25)" }}
        name={input.name}
        id={ind}
        className="input__description"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        value={input.value}
        onChange={(e) => handleChange(e, input.name)}
        placeholder={
          input.placeholder && (focus || input.value) ? input.placeholder : ""
        }
      />
    </main>
  );
};

const SelectInput = ({
  input,
  ind,
  handleSelect,
  className,
  labelValue,
  index,
}) => {
  const [focus, setFocus] = useState(false);
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: "none",
      borderRadius: "4px",
      boxShadow: "none",
      borderRight: "none",
      cursor: "text",
      zIndex: "99999",
      minHeight: "30px",
    }),
    option: (provided, state) => ({
      ...provided,
      zIndex: "99999999999",
      fontSize: "14px",
    }),

    menu: (provided) => ({
      ...provided,
      zIndex: "999999999",
    }),

    singleValue: (provided) => ({
      ...provided,
      zIndex: "99999999999",
      fontSize: "14px",
    }),
  };

  return (
    <main
      className="basic__input__container"
      style={{ padding: className ? "1rem 0.3rem" : "1rem" }}
    >
      {labelValue ? null : (
        <label
          htmlFor={ind}
          style={{
            top: className ? "-1.4rem" : "",
          }}
          className={
            (focus || input.value) && !className
              ? "floating__select"
              : input.insideInputLabel
              ? "label inside__input"
              : "label"
          }
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          {input.labelName}
          {input.required && <span className="required__field">*</span>}
        </label>
      )}
      <Select
        className={
          className && input.value && input.large_width
            ? `${className} selectActive  custom__width__classic`
            : className && input.large_width
            ? `${className} custom__width__classic`
            : className
            ? className
            : input.large_width && input.value
            ? "input__select custom__width selectActive"
            : input.large_width
            ? "input__select custom__width"
            : input.value
            ? "input__select selectActive"
            : "input__select"
        }
        classNamePrefix="select"
        name={input.name}
        options={input.options}
        styles={customStyles}
        placeholder=""
        onChange={(e) => handleSelect(e, input.name, index)}
        onMenuOpen={() => setFocus(true)}
        onMenuClose={() => setFocus(false)}
        value={
          input.value &&
          input.options.find((item) => item.value === input.value)
        }
      />
    </main>
  );
};

export default SharedInputs;

// const SearchSelect = ({ input, ind, handleSelect, options, className }) => {
//   return (
//     <main className="basic__input__container">
//       <label
//         htmlFor={ind}
//         style={{ top: className ? "-1.2rem" : "-0.8rem" }}
//         className="label"
//       >
//         {input.labelName}
//         {input.required && <span className="required__field">*</span>}
//       </label>
//       <Select
//         className={className ? className : "input__select"}
//         classNamePrefix="select"
//         name={input.name}
//         options={input.options}
//         styles={customStyles}
//         placeholder=""
//         onChange={(e) => handleSelect(e, input.name)}
//         value={
//           input.value &&
//           input.options.find((item) => item.value === input.value)
//         }
//       />
//     </main>
//   );
// };

/*const SelectInput = ({ input, ind, handleSelect }) => {
  const [focus, setFocus] = useState(false);

  return (
    <main className="basic__input__container">
      <label
        htmlFor={ind}
        className={focus || input.value ? "floating__select" : "label"}
      >
        {input.labelName}
        {input.required && <span className="required__field">*</span>}
      </label>
      <select
        name={input.name}
        id={ind}
        className="input__text"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => {
          handleSelect(e, input.name, ind);
        }}
        value={input.value || ""}
      >
        <option value="hidden" style={{ visibility: "hidden" }}></option>
        {input.options.map((op, ind) => (
          <option key={ind} value={op.value}>
            <span>{op.label}</span>
          </option>
        ))}
      </select>
    </main>
  );
}; */
