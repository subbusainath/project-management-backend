import * as AWS from "aws-sdk";
const s3 = new AWS.S3();

const params: any = {
  Bucket: process.env.BUCKET_NAME,
  Key: "/image/project-1/testing.png",
};
const s3_upload_url = async (): Promise<any> => {
  try {
    console.log(params);

    // const data = await s3.putObject(params).promise();
    const signedUrl = await s3.getSignedUrlPromise("putObject", {
      Expires: 3600,
      Bucket: params.Bucket,
      Key: params.Key,
    });
    console.log(signedUrl);
    return signedUrl;
  } catch (err) {
    console.log(err);
  }
};

// handler for Upload URL

export const photoUploadHandler = async (): Promise<any> => {
  // if (!event.body) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({
  //       message: "You got to check the body",
  //     }),
  //   };
  // }

  try {
    const preSignedUrl = await s3_upload_url();
    console.log("preSignedUrl: " + preSignedUrl);
    return {
      statusCode: 200,
      body: JSON.stringify({
        PreSignedUrl: preSignedUrl,
        message: "Successfully uploaded the presigned url from the s3 bucket",
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err,
      }),
    };
  }
};
