import React, { useContext } from "react";
import { createContext, useState } from "react";

export const LoaderContext = createContext();

export const useLoading = () => {
  return useContext(LoaderContext);
};

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleLoading = (data) => {
    setIsLoading(data);
  };
  return (
    <LoaderContext.Provider
      value={{
        isLoading,
        handleLoading,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
};

export default LoaderContext;
