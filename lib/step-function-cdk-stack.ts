import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sns from "aws-cdk-lib/aws-sns";

export class StepFunctionCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const snsTopic = new sns.Topic(this, "StepFunctionTestTopic");

    const depositHandler = new lambda.Function(this, "DepositHandler", {
      code: lambda.Code.fromAsset("./dist/lambdas/step-function/deposit"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    const withdrawalHandler = new lambda.Function(this, "WithdrawalHandler", {
      code: lambda.Code.fromAsset("./dist/lambdas/step-function/withdrawal"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    const publishNotiHandler = new lambda.Function(this, "PublishNotiHandler", {
      code: lambda.Code.fromAsset("./dist/lambdas/step-function/publishNoti"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        TOPIC_ARN: snsTopic.topicArn,
      },
    });

    snsTopic.grantPublish(publishNotiHandler);

    // STEP FUNCTION
    const stepSucceeded = sfn.Condition.stringEquals("$.status", "success");
    const stepFailed = sfn.Condition.stringEquals("$.status", "failed");

    const succeedWorkflow = new sfn.Succeed(this, "Workflow succeeded");

    const failWorkflow = new sfn.Fail(this, "Workflow failed");

    const passStep = new sfn.Pass(this, "Pass step", {
      inputPath: "$.data",
      outputPath: "$",
    });

    const executeDeposit = new tasks.LambdaInvoke(
      this,
      "Invoke Deposit Handler",
      {
        lambdaFunction: depositHandler,
        inputPath: "$.payload",
        outputPath: "$.Payload",
      }
    );

    const executeWithdrawal = new tasks.LambdaInvoke(
      this,
      "Invoke Withdrawal Handler",
      {
        lambdaFunction: withdrawalHandler,
        inputPath: "$.payload",
        outputPath: "$.Payload",
      }
    );

    const checkTypeOfMethod = new sfn.Choice(
      this,
      "What type of method user implement: Withdrawal or Deposit?"
    )
      .when(
        sfn.Condition.stringEquals("$.payload.type", "DEPOSIT"),
        executeDeposit
      )
      .when(
        sfn.Condition.stringEquals("$.payload.type", "WITHDRAWAL"),
        executeWithdrawal
      );

    const isImplementMethodSuccessful = new sfn.Choice(
      this,
      "Implement successful?"
    );

    const isPublishSNSSuccessful = new sfn.Choice(
      this,
      "Publish SNS successful?"
    );

    const publishNoti = new tasks.LambdaInvoke(
      this,
      "Invoke Publish Noti Handler",
      {
        lambdaFunction: publishNotiHandler,
        inputPath: "$.payload",
        outputPath: "$.Payload",
      }
    );

    passStep.next(checkTypeOfMethod);

    executeDeposit.next(
      isImplementMethodSuccessful
        .when(stepFailed, failWorkflow)
        .when(stepSucceeded, publishNoti)
    );

    executeWithdrawal.next(
      isImplementMethodSuccessful
        .when(stepFailed, failWorkflow)
        .when(stepSucceeded, publishNoti)
    );

    publishNoti.next(
      isPublishSNSSuccessful
        .when(stepFailed, failWorkflow)
        .when(stepSucceeded, succeedWorkflow)
    );

    const definition = sfn.Chain.start(passStep);

    new sfn.StateMachine(this, "UserMethodStepFunction", {
      definition,
      timeout: cdk.Duration.minutes(5),
    });

    // STEP FUNCTION PARALLEL
    const stepSucceededParallel = sfn.Condition.and(
      sfn.Condition.stringEquals("$[0].status", "success"),
      sfn.Condition.stringEquals("$[1].status", "success")
    );
    const stepFailedParallel = sfn.Condition.or(
      sfn.Condition.stringEquals("$[0].status", "failed"),
      sfn.Condition.stringEquals("$[1].status", "failed")
    );

    const succeedWorkflowParallel = new sfn.Succeed(
      this,
      "Workflow succeeded parallel"
    );

    const failWorkflowParallel = new sfn.Fail(this, "Workflow failed parallel");

    const executeWithdrawalParallel = new tasks.LambdaInvoke(
      this,
      "Invoke Withdrawal Parallel Handler",
      {
        lambdaFunction: withdrawalHandler,
        inputPath: "$.payload",
        outputPath: "$.Payload",
      }
    );

    const publishNotiParallel = new tasks.LambdaInvoke(
      this,
      "Invoke Publish Noti Parallel Handler",
      {
        lambdaFunction: publishNotiHandler,
        inputPath: "$.payload",
        outputPath: "$.Payload",
      }
    );

    const parallelStepWithdrawal = new sfn.Parallel(
      this,
      "Parallel check quantity and send noti withdrawal"
    )
      .branch(executeWithdrawalParallel)
      .branch(publishNotiParallel);

    const checkTypeOfMethodParallel = new sfn.Choice(
      this,
      "What type of method user implement: Withdrawal or Deposit Parallel?",
      {
        inputPath: "$.data",
      }
    )
      .when(
        sfn.Condition.stringEquals("$.payload.type", "DEPOSIT"),
        failWorkflowParallel
      )
      .when(
        sfn.Condition.stringEquals("$.payload.type", "WITHDRAWAL"),
        parallelStepWithdrawal
      );

    const isImplementMethodSuccessfulParallel = new sfn.Choice(
      this,
      "Implement successful parallel?"
    );

    parallelStepWithdrawal.next(
      isImplementMethodSuccessfulParallel
        .when(stepFailedParallel, failWorkflowParallel)
        .when(stepSucceededParallel, succeedWorkflowParallel)
    );

    const definitionParallel = sfn.Chain.start(checkTypeOfMethodParallel);

    new sfn.StateMachine(this, "UserMethodStepFunctionParallel", {
      definition: definitionParallel,
      timeout: cdk.Duration.minutes(5),
    });
  }
}
