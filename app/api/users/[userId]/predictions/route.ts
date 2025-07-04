import { NextRequest, NextResponse } from "next/server";
import { generateCyclePredictions, getLatestPrediction } from "@/lib/db/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get latest prediction
    const prediction = await getLatestPrediction(userId);

    return NextResponse.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("Error fetching cycle predictions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Generate new prediction
    const prediction = await generateCyclePredictions(userId);

    if (!prediction) {
      return NextResponse.json(
        { error: "Insufficient data for prediction. Need at least 2 cycles." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prediction,
      message: "Cycle prediction generated successfully",
    });
  } catch (error) {
    console.error("Error generating cycle predictions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
