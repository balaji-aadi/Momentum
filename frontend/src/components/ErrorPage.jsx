import React from "react";
import "./error.style.css";
import somethingwentwrong from "../assets/somethingwentwrong3.png";

const SomethingWentWrong = () => {
  return (
    <div className="error-container">
      {/* <h1>Oops!</h1> */}
      {/* <p>Something went wrong. Please try again later.</p> */}
      <img src={somethingwentwrong} alt="somethingwentwrong" />
      <button onClick={() => window.location.reload()}>Refresh</button>
    </div>
  );
};

export default SomethingWentWrong;
