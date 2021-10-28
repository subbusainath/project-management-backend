import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attribute`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your Cloudwatch Logs. `;

export const createProjectHandler = async (event: any = {}): Promise<any> => {
  console.log("this is inside the lambda function: ", event);
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid request, you are missing the parameter body",
      }),
    };
  }
  const projects =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);
  console.log("Project event data after it gets the event body", projects);
  projects[PRIMARY_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: projects,
  };
  console.log("this is actually a params for the db", params);
  try {
    const createdData = await db.put(params).promise();
    console.log(
      "Inside the try block and creation of Project data in the dynamodb",
      createdData
    );
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Project data has been created successfully",
      }),
      isBase64Encoded: false,
    };
  } catch (dbError) {
    const errorResponse =
      dbError.code === "ValidationException" &&
      dbError.message.includes("reserved keyword")
        ? DYNAMODB_EXECUTION_ERROR
        : RESERVED_RESPONSE;
    return {
      statusCode: 500,
      body: JSON.stringify(errorResponse),
    };
  }
};
