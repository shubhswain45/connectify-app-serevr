import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'
import { Auth } from './auth';
import JWTService from '../services/JWTService';
import { GraphqlContext } from '../interfaces';
import { Track } from './track';

export async function initServer() {
    const app = express();

    // CORS configuration
    const corsOptions = {
        origin: ['http://localhost:3000'], // your frontend URL
        credentials: true, // Ensure cookies are sent with cross-origin requests
    };

    // Use CORS middleware
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: "12mb" }))
    app.use(cookieParser())

    const graphqlServer = new ApolloServer({
        typeDefs: `
            ${Auth.types}
            ${Track.types}

            type Query {
                ${Auth.queries}
                ${Track.queries}
            }
            
            type Mutation {
                ${Auth.mutations}
                ${Track.mutations}
            }
        `,
        resolvers: {
            Query: {
                ...Auth.resolvers.queries,
                ...Track.resolvers.queries
            },

            Mutation: {
                ...Auth.resolvers.mutations,
                ...Track.resolvers.mutations
            }
        },
    });

    await graphqlServer.start();

    // GraphQL Middleware
    app.use(
        '/graphql',
        // @ts-ignore
        expressMiddleware(graphqlServer, {
            context: async ({ req, res }: { req: Request; res: Response }): Promise<GraphqlContext> => {
                // Retrieve token from cookies
                let token = req.cookies["__connectify_token"];

                // Fallback to Authorization header if cookie is not set
                if (!token && req.headers.authorization) {
                    token = req.headers.authorization.split("Bearer ")[1];
                }

                let user;
                if (token) {
                    try {
                        // Decode the token to retrieve user information
                        user = JWTService.decodeToken(token);
                        console.log("Decoded user:", user);
                    } catch (error) {
                        console.error("Error decoding token:", error);
                    }
                }

                return {
                    user,
                    req,
                    res,
                };
            },
        })
    );


    return app;
}