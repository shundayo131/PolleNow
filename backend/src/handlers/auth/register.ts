// AWS Lambda function to handle user registration 

import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthService } from '../../services/authService';
import { UserInput } from '../../models/user';

export const handler: APIGatewayProxyHandler = async (event): Promise<any> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name } = body;

    // Return 400 if any field is missing
    if (!body.email || !body.password || !body.name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Create a user input object 
    const userInput: UserInput = {
      email,
      password,
      name,
    };

    // Call the AuthService to register the user
    const result = await AuthService.register(userInput);

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    }; 

  } catch (error) {
    console.error('Registration error:', error);

    // TODO: custom error handling to address type error 
    return {
      // statusCode: error.message === 'User already exists' ? 409 : 500,
      // headers: {
      //   'Content-Type': 'application/json',
      //   'Access-Control-Allow-Origin': '*',
      // },
      // body: JSON.stringify({ message: error.message || 'Internal server error' }),
    };
  }
}