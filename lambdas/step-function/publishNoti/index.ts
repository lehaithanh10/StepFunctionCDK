import { EMethodType, MethodData, Output } from "../types";
import { SNS } from "aws-sdk";

const sns = new SNS();

export const handler = async (data: MethodData): Promise<Output> => {
  try {
    const topicArn = process.env.TOPIC_ARN as string;

    // Create the message
    const message =
      data.type === EMethodType.Deposit
        ? `Deposit ${data.quantity} $ successfully, Please check your account balance`
        : data.quantity > 1000
        ? `Can not withdraw ${data.quantity}$, Maximum quantity in one turn is 1000$`
        : `Withdrawal ${data.quantity} $ successfully, Please check your account balance`;

    // Publish the message to the SNS topic
    const params = {
      Message: message,
      TopicArn: topicArn,
    };

    await sns.publish(params).promise();

    return {
      status: "success",
      payload: data,
    };
  } catch (error) {
    return {
      status: "failed",
      message: `Failed to publish SNS notification with error: ${error}`,
    };
  }
};
