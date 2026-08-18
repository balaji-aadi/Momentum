import Api from "../axiosConfig";

export const PamphletApi = {
  getDsaPamphlet: () => Api.get("pamphlet/dsa"),
  syncDsaPamphlet: () => Api.post("pamphlet/dsa/sync"),
};
