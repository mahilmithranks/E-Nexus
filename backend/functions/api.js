import serverless from 'serverless-http';
import app from '../server.js';
import connectDB from '../config/db.js';

// Ensure DB is connected inside the lambda
connectDB();

export const handler = serverless(app);
