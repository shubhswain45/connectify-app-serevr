export const mutations = `#graphql
    signupUser(input: SignupUserInput!): Boolean!
    verifyEmail(input: VerifyEmailInput!): AuthResponse
    loginUser(input: LoginUserInput!): AuthResponse
    forgotPassword(usernameOrEmail: String!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
`