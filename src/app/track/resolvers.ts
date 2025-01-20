import { prismaClient } from "../../clients/db";
import { CreateTrackPayload, GraphqlContext } from "../../interfaces";
import { v2 as cloudinary } from 'cloudinary';

const queries = {
    getFeedTracks: async (_parent: any, _args: any, _ctx: GraphqlContext) => {
        const tracks = await prismaClient.track.findMany();

        return tracks.map((track) => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration.toString(), // Ensure consistent format
            coverImageUrl: track.coverImageUrl || null, // Handle optional fields
            audioFileUrl: track.audioFileUrl,
            hasLiked: true, // Hardcoded for now
            authorName: "me", // Hardcoded for now
        }));
    },
}

const mutations = {
    createTrack: async (
        parent: any,
        { payload }: { payload: CreateTrackPayload },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const { title, audioFileUrl, coverImageUrl, artist, duration } = payload;

            // Upload audio URL to Cloudinary
            const uploadAudioResult = await cloudinary.uploader.upload(audioFileUrl, {
                resource_type: "auto",
            });

            // Upload cover image URL to Cloudinary (if provided)
            let uploadImageResult = null;
            if (coverImageUrl) {
                uploadImageResult = await cloudinary.uploader.upload(coverImageUrl, {
                    resource_type: "auto",
                });
            }

            // Create track in the database
            const track = await prismaClient.track.create({
                data: {
                    title,
                    artist,
                    duration,
                    audioFileUrl: uploadAudioResult.secure_url,
                    coverImageUrl: uploadImageResult?.secure_url,
                    authorId: ctx.user.id, // Link track to the authenticated user
                },
            });

            return {
                id: track.id,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                coverImageUrl: track.coverImageUrl,
                audioFileUrl: track.audioFileUrl,
                hasLiked: false,

                authorName: ctx.user.username
            };
        } catch (error: any) {
            // Handle errors gracefully
            console.error("Error creating track:", error);
            throw new Error(error.message || "An error occurred while creating the track.");
        }
    },
}

export const resolvers = { queries, mutations }