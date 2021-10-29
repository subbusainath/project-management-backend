import * as AWS from "aws-sdk";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attribute`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your Cloudwatch Logs. `;

export const updateProjectHandler = async (event: any): Promise<any> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid request, you are missing the parameter body",
      }),
    };
  }

  const updateProjectId = event.pathParameters.projectId;
  if (!updateProjectId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid request, you are missing the parameter id",
      }),
    };
  }
  const updateProjectItem: any =
    typeof event.body === "object" ? event.body : JSON.parse(event.body);
  const updateProjectIdProperties = Object.keys(updateProjectItem);
  if (!updateProjectItem || updateProjectIdProperties.length < 1) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid Request, No Arguments provided",
      }),
    };
  }

  const firstProp = updateProjectIdProperties.splice(0, 1);
  const params: any = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: updateProjectId,
    },
    UpdateExpression: `set ${firstProp} = :${firstProp}`,
    ExpressionAttributeValues: {},
    ReturnValues: "UPDATED_NEW",
  };
  params.ExpressionAttributeValues[`:${firstProp}`] =
    updateProjectItem[`${firstProp}`];

  updateProjectIdProperties.forEach((prop) => {
    params.UpdateExpression += `, ${prop} = :${prop}`;
    params.ExpressionAttributeValues[`:${prop}`] = updateProjectItem[prop];
  });

  console.log(params);
  try {
    await db.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Data's are updated successfully.",
      }),
      isBase64Encoded: false,
    };
  } catch (error) {
    console.log(error.message);
    const errResponse =
      error.code === "ValidationException" &&
      error.message.includes("reserved keyword")
        ? DYNAMODB_EXECUTION_ERROR
        : RESERVED_RESPONSE;

    return {
      statusCode: 500,
      body: JSON.stringify(errResponse),
      isBase64Encoded: false,
    };
  }
};
