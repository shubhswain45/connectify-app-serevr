import { prismaClient } from "../../clients/db";
import { emailVerificationClient } from "../../clients/redis";
import { GraphqlContext, LoginUserInput, SignupUserInput, VerifyEmailInput } from "../../interfaces";
import JWTService from "../../services/JWTService";
import NodeMailerService from "../../services/NodeMailerService";
import bcrypt from 'bcryptjs'

const queries = {
    getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
        try {
            const id = ctx.user?.id;
            if (!id) return null;

            const user = await prismaClient.user.findUnique({ where: { id } });
            return user;
        } catch (error) {
            return null;
        }
    }
};

const mutations = {
    signupUser: async (parent: any, { input }: { input: SignupUserInput }, ctx: GraphqlContext) => {
        const { email, username } = input;

        try {
            // Check for existing user by email or username
            const existingUser = await prismaClient.user.findFirst({
                where: {
                    OR: [{ email }, { username }],
                },
            });

            if (existingUser) {
                const message =
                    existingUser.username === username
                        ? 'The username is already in use.'
                        : 'The email is already in use.';
                throw new Error(message);
            }

            // Generate and send email verification code if not already generated
            const token = await emailVerificationClient.get(email);
            if (!token) {
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                await emailVerificationClient.set(email, verificationCode, 'EX', 3600); // 1-hour expiry
                await NodeMailerService.sendVerificationEmail(
                    email,
                    `${verificationCode} (Valid for 1 hour)`
                );
            }

            return true
        } catch (error: any) {
            console.error('Error in signupUser:', error);
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    },

    verifyEmail: async (parent: any, { input }: { input: VerifyEmailInput }, ctx: GraphqlContext) => {
        const { email, username, fullName, password, token } = input

        try {
            const existingUser = await prismaClient.user.findUnique({
                where: { email }
            })

            if (existingUser) {
                throw new Error('This email is already verified.');
            }

            const cachedToken = await emailVerificationClient.get(email)
            if (!cachedToken) {
                throw new Error('Verification Token has been expired.');
            } else {
                if (cachedToken !== token) {
                    throw new Error('sorry, verification token does not match');
                }
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const user = await prismaClient.user.create({
                data: {
                    email,
                    username,
                    fullName,
                    password: hashedPassword
                }
            })

            await emailVerificationClient.del(email)

            const userToken = JWTService.generateTokenForUser({ id: user.id, username: user.username });

            ctx.res.cookie('__connectify_token', userToken, {
                httpOnly: true,
                secure: false,
                maxAge: 1000 * 60 * 60 * 24,
                sameSite: 'lax',
                path: '/',
            });

            NodeMailerService.sendWelcomeEmail(email, user?.username || "");

            return { ...user, authToken: userToken }

        } catch (error: any) {
            console.error('Error in verifyEmail:', error);
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    },

    loginUser: async (parent: any, { input }: { input: LoginUserInput }, ctx: GraphqlContext) => {
        const { usernameOrEmail, password } = input

        try {
            const existingUser = await prismaClient.user.findFirst({
                where: {
                    OR: [
                        { username: usernameOrEmail },
                        { email: usernameOrEmail },
                    ],
                },
            });

            if (!existingUser) {
                throw new Error('Sorry, user does not exist!');
            }

            const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

            if (!isPasswordCorrect) {
                throw new Error('Incorrect password!');
            }

            const userToken = JWTService.generateTokenForUser({ id: existingUser.id, username: existingUser.username });

            ctx.res.cookie('__connectify_token', userToken, {
                httpOnly: true,
                secure: false,
                maxAge: 1000 * 60 * 60 * 24,
                sameSite: 'lax',
                path: '/',
            });

            return { ...existingUser, authToken: userToken }

        } catch (error: any) {
            console.error('Error in loginUser:', error);
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }
}

export const resolvers = { queries, mutations }

