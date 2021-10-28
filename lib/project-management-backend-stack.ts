import * as cdk from "@aws-cdk/core";
import * as db from "@aws-cdk/aws-dynamodb";
import { Runtime } from "@aws-cdk/aws-lambda";
import {
  LambdaIntegration,
  RestApi,
  IResource,
  PassthroughBehavior,
  MockIntegration,
} from "@aws-cdk/aws-apigateway";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "@aws-cdk/aws-lambda-nodejs";
import * as path1 from "path";
const dirname = path1.resolve();

export class ProjectManagementBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dynamodb table creations Project Management app
    const table = new db.Table(this, "Project Table", {
      partitionKey: {
        name: "projectId",
        type: db.AttributeType.STRING,
      },
      billingMode: db.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "projectTable",
    });

    // Lambda functions for Project Management app

    // create Project NodejsFunctionProps
    const nodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: path1.join(dirname, "lambdas", "package-lock.json"),
      handler: "createProjectHandler",
      environment: {
        PRIMARY_KEY: "projectId",
        TABLE_NAME: table.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    };

    //get-all Project NodejsFunctionProps
    const getAllProjectNodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: path1.join(dirname, "lambdas", "package-lock.json"),
      handler: "getAllProjectHandler",
      environment: {
        TABLE_NAME: table.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    };

    //get single Project NodejsFunctionProps
    const getSingleProjectNodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: path1.join(dirname, "lambdas", "package-lock.json"),
      handler: "getSingleProjectHandler",
      environment: {
        TABLE_NAME: table.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    };

    // update Project NodejsFunctionProps
    const updateProjectNodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: path1.join(dirname, "lambdas", "package-lock.json"),
      handler: "updateProjectHandler",
      environment: {
        TABLE_NAME: table.tableName,
        PRIMARY_KEY: "projectId",
      },
      runtime: Runtime.NODEJS_14_X,
    };

    // create a lambda function for each of the CRUD operations
    const createProjectLambda = new NodejsFunction(
      this,
      "createProjectFunction",
      {
        entry: path1.join(dirname, "lambdas", "create-project.ts"),
        ...nodejsFunctionProps,
      }
    );

    const readAllProjectLambda = new NodejsFunction(
      this,
      "readAllProjectFunction",
      {
        entry: path1.join(dirname, "lambdas", "get-project.ts"),
        ...getAllProjectNodejsFunctionProps,
      }
    );

    const getSingleProjectLambda = new NodejsFunction(
      this,
      "getSingleProjectFunction",
      {
        entry: path1.join(dirname, "lambdas", "get-single-project.ts"),
        ...getSingleProjectNodejsFunctionProps,
      }
    );

    const updateProjectLambda = new NodejsFunction(
      this,
      "updateProjectFunction",
      {
        entry: path1.join(dirname, "lambdas", "update-project.ts"),
        ...updateProjectNodejsFunctionProps,
      }
    );

    // Grant lambda function read write access to the DynamoDB table
    table.grantReadWriteData(createProjectLambda);
    table.grantReadData(readAllProjectLambda);
    table.grantReadData(getSingleProjectLambda);
    table.grantReadWriteData(updateProjectLambda);

    // Integrate the lambda functions with the API Gateway resource
    const createProjectIntegration = new LambdaIntegration(createProjectLambda);
    const readAllProjectIntegration = new LambdaIntegration(
      readAllProjectLambda
    );
    const getSingleProjectIntegration = new LambdaIntegration(
      getSingleProjectLambda
    );
    const updateProjectIntegration = new LambdaIntegration(updateProjectLambda);
    //create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, "projectApi", {
      restApiName: "Project Services",
    });

    // POST endpoint
    const projects = api.root.addResource("projects");
    projects.addMethod("POST", createProjectIntegration);
    addCorsOptions(projects);

    //GET endpoint
    const getAllProjects = api.root.addResource("allprojects");
    getAllProjects.addMethod("GET", readAllProjectIntegration);
    addCorsOptions(getAllProjects);

    //GET SINGLE endpoint
    const getSingleProject = api.root.resourceForPath("/projects/{projectId}");
    getSingleProject.addMethod("GET", getSingleProjectIntegration);
    addCorsOptions(getSingleProject);

    //UPDATE endpoint
    const updateProject = api.root.resourceForPath(
      "/projects/project/{projectId}"
    );
    updateProject.addMethod("PUT", updateProjectIntegration);
    addCorsOptions(updateProject);
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}
