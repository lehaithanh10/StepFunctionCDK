import { MethodData, Output } from "../types";

export const handler = async (data: MethodData): Promise<Output> => {
  if (data.quantity < 0) {
    return {
      status: "failed",
      message: "Can not deposit the negative quantity of money",
    };
  }

  return {
    status: "success",
    payload: data,
  };
};
