export const mutations = `#graphql
    signupUser(input: SignupUserInput!): Boolean!
    verifyEmail(input: VerifyEmailInput!): User
`