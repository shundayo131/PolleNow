// Test handler function 

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
  console.log("Hello from Lambda!");
  console.log("Event: ", JSON.stringify(event, null, 2));

  // Retuirn a test message
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Lambda!",
      input: event,
    }),
  } as APIGatewayProxyResult;
}