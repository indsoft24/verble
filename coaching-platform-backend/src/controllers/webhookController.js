import axios from 'axios';
import Video from '../models/Video.js';
import { configureVideoSecurity } from '../utils/bunnyStreamSecurity.js';

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

export const handleBunnyWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log('--- BUNNY WEBHOOK RECEIVED ---', payload);
        const { VideoGuid, Status } = payload;

        if (Status !== 4) {
            console.log(`Received intermediate status ${Status} for ${VideoGuid}. No final action needed.`);
            return res.status(200).send('Webhook acknowledged.');
        }
        
        const videoInDb = await Video.findOne({ bunnyVideoId: VideoGuid });
        if (!videoInDb) {
            console.warn(`Webhook for unknown VideoGuid: ${VideoGuid}. Ignoring.`);
            return res.status(200).send('OK; Video not found in DB.');
        }

        console.log(`Video ${VideoGuid} is finished. Fetching full details from Bunny API...`);
        const videoDetailsResponse = await axios.get(
            `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${VideoGuid}`,
            { headers: { 'AccessKey': BUNNY_STREAM_API_KEY } }
        );
        const videoDetails = videoDetailsResponse.data;
        if (!videoDetails) {
            throw new Error(`Could not fetch details for video ${VideoGuid} from Bunny API.`);
        }
        
        const fieldsToUpdate = {
            videoStatus: 'AVAILABLE',
            bunnyProcessingProgress: 100,
            durationSeconds: videoDetails.length || 0,
            width: videoDetails.width || 0,
            height: videoDetails.height || 0,
            bunnyStreamUrl: `https://vz-0ce8a110-5fd.b-cdn.net/${VideoGuid}/playlist.m3u8`,
            bunnyThumbnailUrl: `https://vz-0ce8a110-5fd.b-cdn.net/${VideoGuid}/${videoDetails.thumbnailFileName}`
        };

        const updatedVideo = await Video.findByIdAndUpdate(
            videoInDb._id, 
            { $set: fieldsToUpdate },
            { new: true } 
        );
        
        console.log(`SUCCESS: Video ${updatedVideo._id} (${updatedVideo.title}) fully updated in DB.`);

        // Configure security settings for the video
        // This ensures token authentication and prevents direct downloads
        await configureVideoSecurity(VideoGuid);

        res.status(200).send('Webhook processed and video details updated.');

    } catch (error) {
        console.error('Error processing webhook payload:', error.response?.data || error.message);
        res.status(500).send('Internal Server Error.');
    }
};