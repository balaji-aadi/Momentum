import { createContext, useState } from "react";

export const ToggleContext = createContext();

export const ToggleContextProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isToggle, setIsToggle] = useState(false);

  const toggle = () => {
    setIsOpen(!isOpen);
    setIsToggle(!isToggle);
  };

  return (
    <ToggleContext.Provider
      value={{ isOpen, toggle, setIsOpen, isToggle, setIsToggle }}
    >
      {children}
    </ToggleContext.Provider>
  );
};
