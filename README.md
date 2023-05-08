## Setup

### Prerequisites

- Get your AWS account ID [via the aws console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home) or from your shell
  ```sh
    aws sts get-caller-identity | cut -f1
  ```
- Get your AWS access keys ([AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds))

### AWS CLI

Install the AWS CLI following the official guidelines: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html.

Configure your AWS CLI using your AWS access keys, and the following settings:

```sh
$ aws configure
AWS Access Key ID [None]: ...
AWS Secret Access Key [None]: ...
Default region name [None]: ap-southeast-1
Default output format [None]: text
```

### Deployment

```sh
$ npm run cdk -- deploy
...
Do you wish to deploy these changes (y/n)? y
...
 ✅  StepFunctionCdkStack

✨  Deployment time: 29.79s

... 

✨  Total time: 34.16s
```

## Your first lambda

### Code

Create the `lambdas/hello-world` folder in the project directory.
Create the `lambdas/hello-world/index.ts` file and paste the following code inside:

```typescript
import { APIGatewayEvent } from "aws-lambda";
import { genericApiHandler } from "../shared/sharedApiHandler";
import { sendSuccess } from "../shared/helpers";
import { HTTP_CODES } from "../shared/constants";

export const handler = async (event: APIGatewayEvent) => ({
        status: 'success',
        data: "Hello World!",
});
```

Register the existence of this lambda within `.scripts/bundle.js` by adding `hello-world` to the `functions` constant:

```js
const functions = [
  //...
  "hello-world",
];
```

### Provisioning

Provision the lambda with the `lib/step-function-cdk-stack.ts` file:

```typescript
const helloWorldHandler = new lambda.Function(this, "HelloWorldHandler", {
  ...this.getDefaultLambdaProperties("helloWorldHandler"),
  code: lambda.Code.fromAsset("./dist/lambdas/hello-world"),
  environment: {
    NODE_OPTIONS: "--enable-source-maps",
    REGION: this.region,
  },
});
```

After that you can deploy and see the new lambda function in your aws console
