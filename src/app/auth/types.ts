export const types = `#graphql
    type User {
        id: String!
        email: String!
        username: String!
        fullName: String!
        bio: String
        profileImageURL: String
    }

    input SignupUserInput {
        email: String!
        username: String!
    }

    input VerifyEmailInput {
        email: String!
        username: String!
        fullName: String!
        password: String!
        token : String!
    }
`

// model User {
//     id              String  @id @default(cuid()) // Unique identifier
//     email           String  @unique // Email, must be unique
//     username        String  @unique // Username, must be unique
//     fullName        String // Full name of the user
//     password        String // User's hashed password
//     bio             String? // Optional bio
//     profileImageURL String? // Optional profile image URL
  
//     createdAt DateTime @default(now()) // User creation timestamp
//     updatedAt DateTime @updatedAt // Auto-updated timestamp
//   }