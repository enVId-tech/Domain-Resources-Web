import { connectToDatabase } from "@/app/utils/db";
import { checkUrl } from "@/app/utils/validation";
import { NextResponse } from "next/server";

interface LinksActive {
    link: string;
    active: boolean;
}

interface LinkDocument {
    _id?: unknown;
    id: number;
    title: string;
    url: string;
    description: string;
    icon: string;
}

export const revalidate = 1800;

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("links");

        const linkData = await collection.find().toArray() as unknown as LinkDocument[];

        for (const link of linkData) {
            delete link._id;
        }

        // Use Promise.all to wait for all URL checks to complete
        const linksActive: LinksActive[] = await Promise.all(
            linkData.map(async (linkEntry: LinkDocument) => ({
                link: linkEntry.url,
                active: await checkUrl(linkEntry.url)
            }))
        );

        return NextResponse.json(
            {
                success: true,
                links: linkData || [],
                linksActive: linksActive
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
                },
            }
        )
    } catch (err: unknown) {
        console.error(`An error has occured fetching links: ${err as string}`)
        return NextResponse.json(
            { success: false, error: `Failed to fetch links: ${err as string}` },
            { status: 500 }
        )
    }
}