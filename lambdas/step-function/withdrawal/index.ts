import { MethodData, Output } from "../types";

export const handler = async (data: MethodData): Promise<Output> => {
  if (data.quantity > 1000) {
    return {
      status: "failed",
      message: "Can not withdrawal more than 1000$ in one day",
    };
  }

  return {
    status: "success",
    payload: data,
  };
};
