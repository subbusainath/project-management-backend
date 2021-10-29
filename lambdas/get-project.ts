import * as AWS from "aws-sdk";

const TABLE_NAME = process.env.TABLE_NAME || "";

const db = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attribute`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your Cloudwatch Logs. `;

export const getAllProjectHandler = async (event: any): Promise<any> => {
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const retreivedData = await db.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(retreivedData),
      isBase64Encoded: false,
    };
  } catch (error) {
    const errResponse =
      error.code === "ValidationException" &&
      error.message.includes("reserved keyword")
        ? DYNAMODB_EXECUTION_ERROR
        : RESERVED_RESPONSE;
    return {
      statusCode: 500,
      body: JSON.stringify(errResponse),
    };
  }
};
