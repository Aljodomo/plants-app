import {DefaultApi} from "@generated/my-api";

export async function identifyPlant(imageUrls: string[]) {

    return await new DefaultApi().identifyPlant({
        apiKey: import.meta.env.VITE_MY_API_KEY,
        identifyPlantRequest: {
            images: imageUrls
        }
    })

    // return await fetch("http://127.0.0.1:5001/plants-app-c271d/us-central1/identifyPlant?" + new URLSearchParams({
    //     apiKey: import.meta.env.VITE_MY_API_KEY
    // }), {
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     method: 'POST',
    //     body: JSON.stringify(
    //         {
    //             images : [imageUrls],
    //         }
    //     )
    // }).then(res => res.json())

}
//
// export async function identifyPlantByBlob(images: Blob[]) {
//
//     return await new DefaultApi().identifyPlantByBlob({
//         images: images,
//         apiKey: import.meta.env.VITE_MY_API_KEY,
//     })
//
// }