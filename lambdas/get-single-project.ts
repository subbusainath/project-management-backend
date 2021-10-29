import * as AWS from "aws-sdk";

const TABLE_NAME = process.env.TABLE_NAME || "";

const db = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attribute`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your Cloudwatch Logs. `;

export const getSingleProjectHandler = async (event: any): Promise<any> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      projectId: event.pathParameters.projectId,
    },
  };

  console.log("Params to get the single item from the dynamodb", params);

  try {
    const singleData = await db.get(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(singleData),
      isBase64Encoded: false,
    };
  } catch (error) {
    const err =
      error.code === "ValidationException" &&
      error.message.includes("reserved keyword")
        ? DYNAMODB_EXECUTION_ERROR
        : RESERVED_RESPONSE;
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
