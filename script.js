document.getElementById('generate-btn').addEventListener('click', async function() {
    const text = document.getElementById('text-input').value;
    if (!text) {
        alert('Please enter some text.');
        return;
    }

    try {
        const videoBlob = await generateVideo(text);
        const videoUrl = URL.createObjectURL(videoBlob);

        const downloadBtn = document.getElementById('download-btn');
        const statusMessage = document.getElementById('status-message');

        downloadBtn.style.display = 'inline'; // Make the download button visible
        downloadBtn.href = videoUrl;
        downloadBtn.download = 'text-video.mp4';
        downloadBtn.textContent = 'Download Video';

        statusMessage.textContent = 'Your video is ready for download!';
    } catch (error) {
        console.error('Error generating video:', error);
        alert('There was an error generating the video. Check the console for details.');
    }
});

async function generateVideo(text) {
    const fps = 30;
    const duration = 5; // Duration in seconds
    const frameCount = fps * duration;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 640; // Video width
    const height = 480; // Video height
    canvas.width = width;
    canvas.height = height;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';

    // Generate frames
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillText(text, width / 2, height / 2);
        frames.push(canvas.toDataURL('image/png'));
    }

    // Convert frames to video
    return new Promise((resolve, reject) => {
        try {
            const mimeType = 'video/mp4';
            const video = document.createElement('video');
            const stream = video.captureStream();
            const recorder = new MediaRecorder(stream, { mimeType });
            const chunks = [];

            recorder.ondataavailable = event => chunks.push(event.data);
            recorder.onerror = error => reject(error);
            recorder.onstop = () => {
                resolve(new Blob(chunks, { type: mimeType }));
            };

            recorder.start();

            // Function to simulate frame capture and adding to video
            const addFramesToVideo = () => new Promise((resolve) => {
                let index = 0;
                const intervalId = setInterval(() => {
                    if (index >= frames.length) {
                        clearInterval(intervalId);
                        recorder.stop();
                        resolve();
                    } else {
                        const image = new Image();
                        image.src = frames[index];
                        image.onload = () => {
                            const frameCanvas = document.createElement('canvas');
                            frameCanvas.width = width;
                            frameCanvas.height = height;
                            const ctx = frameCanvas.getContext('2d');
                            ctx.drawImage(image, 0, 0, width, height);
                            const frameStream = frameCanvas.captureStream(fps);
                            const frameRecorder = new MediaRecorder(frameStream, { mimeType });
                            frameRecorder.start();
                            frameRecorder.ondataavailable = event => {
                                if (event.data.size > 0) {
                                    chunks.push(event.data);
                                }
                            };
                            frameRecorder.stop();
                        };
                        index++;
                    }
                }, 1000 / fps);
            });

            addFramesToVideo();
        } catch (error) {
            reject(error);
        }
    });
}