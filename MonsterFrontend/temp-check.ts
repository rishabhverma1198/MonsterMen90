// Temporary test file to check if API integration exports work
import { BaseAPIClient } from './src/lib/services/api-integration';

// Test that the main export works by accessing the class
console.log('API integration module imported successfully!');
console.log('BaseAPIClient available:', typeof BaseAPIClient);
export {};