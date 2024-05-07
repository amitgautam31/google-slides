import {JWT} from "google-auth-library"
export async function POST(request: Request) {
  try {
    let { slideUrl, presentationId } = await request.json();
    if (!slideUrl && !presentationId) {
      return Response.json(
        { error: "slide url or presentation id is required" },
        { status: 400 }
      );
    }
    if (!presentationId && slideUrl) {
      const match = slideUrl.match(/\/d\/(?:e\/)?([^/]+)/);
      if (match) {
        presentationId = match[1];
      } else {
        return Response.json(
          { error: "Unable to extract presentation ID from the slide URL" },
          { status: 400 }
        );
      }
    }


    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/presentations",
        "https://www.googleapis.com/auth/presentations.readonly",
      ],
    });
    const oAuthToken = await serviceAccountAuth.getAccessToken();
    // const presentationId = "1vRy3n_ll8Zz8-1B8miTjOs_7voRF5y1hgb16ZbqXTqU";

    const res = await fetch(
      "https://slides.googleapis.com/v1/presentations/" + presentationId,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${oAuthToken.token}`,
        },
      }
    );
    const result = await res.json();
    const data = result.slides.map((slide: any, index: number) => {
      return { ...slide, url: slide?.slideProperties?.pageElements?.[0]?.pageUrl, slideNumber: index + 1 }
    })



    return Response.json({ data  }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
