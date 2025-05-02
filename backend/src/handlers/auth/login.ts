import { AuthService } from '../../services/authService';
import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event): Promise<any> => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    // Validate input
    if (!body.email || !body.password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Authenticate the user using AuthService
    const result = await AuthService.loginUser(email, password);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Login error:', error);    
    
    // TODO: error handling 
  }
}