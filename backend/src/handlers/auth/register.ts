import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthService } from '../../services/authService';
import { UserInput } from '../../models/user';

// Lambda function to handle user registration 
export const handler: APIGatewayProxyHandler = async (event): Promise<any> => {
  try {
    // Parse the request body 
    const body = JSON.parse(event.body || '{}');
    const { email, password, name } = body;

    // Validate required fields
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

    // Construct the user input object
    const userInput: UserInput = {
      email,
      password,
      name,
    };

    // Register the user using AuthService 
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
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage === 'User already exists' ? 409 : 500;
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: errorMessage }),
    };
  }
}