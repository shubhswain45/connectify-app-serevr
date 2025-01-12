import { Request, Response } from "express"

export interface JWTUser {
    id: string
    username: string
}

export interface GraphqlContext {
    user?: JWTUser 
    req: Request
    res: Response
}

export interface SignupUserInput {
    email: string;
    username: string;
}

export interface VerifyEmailInput {
    email: string;
    username: string;
    fullName: string;
    password: string;
    token: string;
}
