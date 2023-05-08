export enum EMethodType {
  Withdrawal = "WITHDRAWAL",
  Deposit = "DEPOSIT",
}

export type MethodData = {
  type: EMethodType;
  quantity: number;
};

export type SuccessOutput = {
  status: "success";
  payload: MethodData;
};

export type FailureOutput = {
  status: "failed";
  message: string;
};

export type Output = SuccessOutput | FailureOutput;
