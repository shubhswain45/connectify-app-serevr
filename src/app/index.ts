import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'
import { Auth } from './auth';

export async function initServer() {
    const app = express();

    // CORS configuration
    const corsOptions = {
        origin: ['http://localhost:3000'], // your frontend URL
        credentials: true, // Ensure cookies are sent with cross-origin requests
    };

    // Use CORS middleware
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: "10mb" }))
    app.use(cookieParser())

    const graphqlServer = new ApolloServer({
        typeDefs: `
            ${Auth.types}

            type Query {
                sayHello: String
            }
            
            type Mutation {
                ${Auth.mutations}
            }
        `,
        resolvers: {
            Query: {
                sayHello: () => "Hello"
            },
            
            Mutation: {
                ...Auth.resolvers.mutations
            }
        },
    });

    await graphqlServer.start();

    // GraphQL Middleware
    app.use(
        '/graphql',
        // @ts-ignore
        expressMiddleware(graphqlServer)
    );


    return app;
}